using System.Reflection;
using System.Runtime.InteropServices.JavaScript;
using System.Text;
using System.Text.Json;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using static Microsoft.CodeAnalysis.CSharp.SyntaxFactory;

// This application is the compiler host, not the child's precompiled program.
public static partial class QuestRuntime {
    static readonly List<MetadataReference> References = new();
    public static void Main() { }
    [JSImport("dispatch", "codequest")]
    internal static partial string Dispatch(string operation, string arguments);
    public static void Trace(string feature) => Dispatch("__trace", JsonSerializer.Serialize(new[]{feature}));
    public static T Mark<T>(T value, string feature) { Trace(feature); return value; }
    public static string Command(string operation, string arguments) => Dispatch(operation, arguments);
    [JSExport]
    public static string Init(string json) {
        References.Clear();
        foreach (var image in JsonSerializer.Deserialize<string[]>(json)!)
            References.Add(MetadataReference.CreateFromImage(Convert.FromBase64String(image)));
        return $".NET {Environment.Version}; Roslyn {typeof(CSharpCompilation).Assembly.GetName().Version}; C# 13";
    }
    [JSExport]
    public static string Execute(string source, string api) {
        if (source.Length > 32768) return JsonSerializer.Serialize(new {error="Keep your program under 32,768 characters."});
        var output = new LimitedOutput();
        Console.SetOut(output);Console.SetError(output);
        try {
            var parse = new CSharpParseOptions(LanguageVersion.CSharp13);
            var tree = CSharpSyntaxTree.ParseText(source, parse, "YourCode.cs");
            var errors = tree.GetDiagnostics().Where(d=>d.Severity==DiagnosticSeverity.Error).ToArray();
            if(errors.Length>0) return Diagnostics(errors);
            var root = new EvidenceRewriter().Visit(tree.GetRoot())!;
            var instrumented = CSharpSyntaxTree.Create((CSharpSyntaxNode)root, parse, "YourCode.cs");
            var apiTree = CSharpSyntaxTree.ParseText(api, parse, "SuppliedGameAPI.cs");
            var usings = CSharpSyntaxTree.ParseText("global using System; global using System.Collections.Generic; global using System.Linq;", parse, "SuppliedUsings.cs");
            var compilation = CSharpCompilation.Create("QuestChildProgram", new[]{instrumented,apiTree,usings}, References,
                new CSharpCompilationOptions(OutputKind.ConsoleApplication, optimizationLevel:OptimizationLevel.Debug, concurrentBuild:false));
            using var stream = new MemoryStream();
            var emitted = compilation.Emit(stream);
            if(!emitted.Success) return Diagnostics(emitted.Diagnostics.Where(d=>d.Severity==DiagnosticSeverity.Error).ToArray());
            Dispatch("__phase", "[\"running\"]");
            var assembly = Assembly.Load(stream.ToArray());
            var entry = assembly.EntryPoint!;
            var result = entry.Invoke(null, entry.GetParameters().Length==0?null:new object[]{Array.Empty<string>()});
            if(result is System.Threading.Tasks.Task) throw new InvalidOperationException("Use synchronous game commands here; asynchronous entry points are not supported in CodeQuest.");
            output.Flush();
            return "{\"error\":\"\"}";
        } catch (Exception e) {
            while(e is TargetInvocationException && e.InnerException!=null)e=e.InnerException;
            return JsonSerializer.Serialize(new {error=e.GetType().Name+": "+e.Message});
        }
    }
    static string Diagnostics(Diagnostic[] errors) => JsonSerializer.Serialize(new {error=string.Join("\n", errors.Take(6).Select(d=>{
        var loc=d.Location.GetLineSpan();return $"Line {loc.StartLinePosition.Line+1}: {d.GetMessage()} ({d.Id})";
    }))});
    sealed class LimitedOutput:TextWriter {
        public override Encoding Encoding=>Encoding.UTF8;
        int count;readonly StringBuilder pending=new();
        public override void Write(char c) {
            if(++count>8192)throw new InvalidOperationException("Output limit reached. Try fewer messages.");
            if(c=='\n'){Dispatch("__output",JsonSerializer.Serialize(new[]{pending.ToString().TrimEnd('\r')}));pending.Clear();}
            else pending.Append(c);
        }
        public override void Write(string? s){if(s!=null)foreach(var c in s)Write(c);}
        public override void WriteLine(string? s){Write(s);Write('\n');}
        public override void Flush(){if(pending.Length>0){Dispatch("__output",JsonSerializer.Serialize(new[]{pending.ToString()}));pending.Clear();}}
    }
    // Instrument executed constructs. A loop in dead code does not earn loop evidence.
    sealed class EvidenceRewriter:CSharpSyntaxRewriter {
        static StatementSyntax Mark(params string[] features)=>ParseStatement("{ "+string.Join(" ",features.Select(x=>$"QuestRuntime.Trace(\"{x}\");"))+" }");
        static BlockSyntax Body(StatementSyntax s,params string[] features)=>s is BlockSyntax b?b.WithStatements(b.Statements.Insert(0,Mark(features))):Block(Mark(features),s);
        public override SyntaxNode? VisitForStatement(ForStatementSyntax n){var v=(ForStatementSyntax)base.VisitForStatement(n)!;return v.WithStatement(Body(v.Statement,"loop","for"));}
        public override SyntaxNode? VisitForEachStatement(ForEachStatementSyntax n){var v=(ForEachStatementSyntax)base.VisitForEachStatement(n)!;return v.WithStatement(Body(v.Statement,"loop","foreach","list"));}
        public override SyntaxNode? VisitWhileStatement(WhileStatementSyntax n){var v=(WhileStatementSyntax)base.VisitWhileStatement(n)!;return v.WithStatement(Body(v.Statement,"loop","while"));}
        public override SyntaxNode? VisitIfStatement(IfStatementSyntax n){var v=(IfStatementSyntax)base.VisitIfStatement(n)!;var f=v.Else==null?new[]{"condition"}:new[]{"condition","else"};v=v.WithStatement(Body(v.Statement,f));if(v.Else!=null)v=v.WithElse(v.Else.WithStatement(Body(v.Else.Statement,f)));return v;}
        public override SyntaxNode? VisitLocalFunctionStatement(LocalFunctionStatementSyntax n){var v=(LocalFunctionStatementSyntax)base.VisitLocalFunctionStatement(n)!;var marks=v.ParameterList.Parameters.Count>0?new[]{"function","parameter"}:new[]{"function"};if(v.ExpressionBody!=null)v=v.WithBody(ExpressionBody(v.ExpressionBody.Expression,v.ReturnType)).WithExpressionBody(null).WithSemicolonToken(default);if(v.Body!=null)v=v.WithBody(Body(v.Body,marks));return v;}
        public override SyntaxNode? VisitMethodDeclaration(MethodDeclarationSyntax n){var v=(MethodDeclarationSyntax)base.VisitMethodDeclaration(n)!;var marks=new List<string>{"function"};if(!v.Modifiers.Any(SyntaxKind.StaticKeyword))marks.Add("class");if(v.ParameterList.Parameters.Count>0)marks.Add("parameter");if(v.ExpressionBody!=null)v=v.WithBody(ExpressionBody(v.ExpressionBody.Expression,v.ReturnType)).WithExpressionBody(null).WithSemicolonToken(default);if(v.Body!=null)v=v.WithBody(Body(v.Body,marks.ToArray()));return v;}
        static BlockSyntax ExpressionBody(ExpressionSyntax expression,TypeSyntax type)=>Block(type is PredefinedTypeSyntax p&&p.Keyword.IsKind(SyntaxKind.VoidKeyword)?ExpressionStatement(expression):ReturnStatement(expression));
        public override SyntaxNode? VisitBinaryExpression(BinaryExpressionSyntax n){var v=(BinaryExpressionSyntax)base.VisitBinaryExpression(n)!;string? feature=IsComparison(n)?"comparison":n.IsKind(SyntaxKind.MultiplyExpression)||n.IsKind(SyntaxKind.SubtractExpression)||n.IsKind(SyntaxKind.AddExpression)||n.IsKind(SyntaxKind.DivideExpression)||n.IsKind(SyntaxKind.ModuloExpression)?"arithmetic":null;if(feature==null)return v;return InvocationExpression(ParseExpression("QuestRuntime.Mark"),ArgumentList(SeparatedList(new[]{Argument(v.WithoutTrivia()),Argument(LiteralExpression(SyntaxKind.StringLiteralExpression,Literal(feature)))}))).WithTriviaFrom(n);}
        public override SyntaxNode? VisitConstructorDeclaration(ConstructorDeclarationSyntax n){var v=(ConstructorDeclarationSyntax)base.VisitConstructorDeclaration(n)!;if(v.Body!=null)v=v.WithBody(Body(v.Body,"class","variable"));return v;}
        public override SyntaxNode? VisitBlock(BlockSyntax n){var v=(BlockSyntax)base.VisitBlock(n)!;var statements=new List<StatementSyntax>();foreach(var s in v.Statements){statements.Add(s);if(s is LocalDeclarationStatementSyntax){statements.Add(Mark("variable","types"));AddExpressionMarks(s,statements);}}return v.WithStatements(List(statements));}
        public override SyntaxNode? VisitCompilationUnit(CompilationUnitSyntax n){var v=(CompilationUnitSyntax)base.VisitCompilationUnit(n)!;var members=new List<MemberDeclarationSyntax>();foreach(var m in v.Members){members.Add(m);if(m is GlobalStatementSyntax g && g.Statement is LocalDeclarationStatementSyntax){var marks=new List<StatementSyntax>{Mark("variable","types")};AddExpressionMarks(g,marks);members.AddRange(marks.Select(GlobalStatement));}}return v.WithMembers(List(members));}
        static void AddExpressionMarks(SyntaxNode s,List<StatementSyntax> statements){if(s.DescendantNodes().OfType<BinaryExpressionSyntax>().Any(IsComparison))statements.Add(Mark("comparison"));if(s.DescendantNodes().OfType<BinaryExpressionSyntax>().Any(x=>x.IsKind(SyntaxKind.MultiplyExpression)||x.IsKind(SyntaxKind.SubtractExpression)||x.IsKind(SyntaxKind.AddExpression)||x.IsKind(SyntaxKind.DivideExpression)))statements.Add(Mark("arithmetic"));}
        static bool IsComparison(BinaryExpressionSyntax x)=>x.IsKind(SyntaxKind.GreaterThanExpression)||x.IsKind(SyntaxKind.GreaterThanOrEqualExpression)||x.IsKind(SyntaxKind.LessThanExpression)||x.IsKind(SyntaxKind.LessThanOrEqualExpression)||x.IsKind(SyntaxKind.EqualsExpression)||x.IsKind(SyntaxKind.NotEqualsExpression);
    }
}
