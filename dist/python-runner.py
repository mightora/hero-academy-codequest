# Supplied interpreter harness. Editable code is parsed and executed by CPython.
import ast as _ast, json as _json, sys as _sys, traceback as _tb
from academy_bridge import command as _command, sensor as _sensor, trace as _trace, output as _output

def _mark(value, feature):
    _trace(feature)
    return value

class _Game:
    def __getattr__(self, name):
        if name in ('energy','needed','count','sensor','destination','delivery_list','district'):
            def sense():
                if name in ('delivery_list','district'): _trace('list')
                return _json.loads(_sensor(name))
            return sense
        allowed=('move','robot','supply','gate','route','water','light','charge','repair','deliver','lift','store','collect')
        if name not in allowed: raise AttributeError('Choose a game command from Pip’s guide.')
        def action(*args):
            _command(name, _json.dumps(args), _sys._getframe(1).f_lineno)
        return action

def _trace_stmt(feature, loc):
    return _ast.copy_location(_ast.Expr(value=_ast.Call(func=_ast.Name(id='_cq_trace',ctx=_ast.Load()),args=[_ast.Constant(feature)],keywords=[])),loc)

class _Evidence(_ast.NodeTransformer):
    def visit_For(self,n):
        self.generic_visit(n);n.body=[_trace_stmt('loop',n),_trace_stmt('for',n)]+n.body;return n
    def visit_While(self,n):
        self.generic_visit(n);n.body=[_trace_stmt('loop',n),_trace_stmt('while',n)]+n.body;return n
    def visit_If(self,n):
        has_else=bool(n.orelse);self.generic_visit(n)
        return [_trace_stmt('condition',n)]+([_trace_stmt('else',n)] if has_else else [])+[n]
    def visit_FunctionDef(self,n):
        self.generic_visit(n);n.body=[_trace_stmt('function',n)]+([_trace_stmt('parameter',n)] if n.args.args else [])+n.body;return n
    def visit_Assign(self,n):
        self.generic_visit(n);return [n,_trace_stmt('variable',n)]
    def visit_AnnAssign(self,n):
        self.generic_visit(n);return [n,_trace_stmt('variable',n)]
    def visit_AugAssign(self,n):
        self.generic_visit(n);return [n,_trace_stmt('variable',n),_trace_stmt('arithmetic',n)]
    def visit_BinOp(self,n):
        self.generic_visit(n);return _ast.copy_location(_ast.Call(func=_ast.Name(id='_cq_mark',ctx=_ast.Load()),args=[n,_ast.Constant('arithmetic')],keywords=[]),n)
    def visit_Compare(self,n):
        self.generic_visit(n);return _ast.copy_location(_ast.Call(func=_ast.Name(id='_cq_mark',ctx=_ast.Load()),args=[n,_ast.Constant('comparison')],keywords=[]),n)
    def visit_List(self,n):
        self.generic_visit(n);return _ast.copy_location(_ast.Call(func=_ast.Name(id='_cq_mark',ctx=_ast.Load()),args=[n,_ast.Constant('list')],keywords=[]),n)
    def visit_Call(self,n):
        self.generic_visit(n)
        if isinstance(n.func,_ast.Name) and n.func.id=='sum':
            return _ast.copy_location(_ast.Call(func=_ast.Name(id='_cq_mark',ctx=_ast.Load()),args=[n,_ast.Constant('arithmetic')],keywords=[]),n)
        return n

class _Output:
    def __init__(self):self.count=0;self.pending=''
    def write(self,text):
        self.count+=len(text)
        if self.count>8192:raise RuntimeError('Output limit reached. Try fewer messages.')
        self.pending+=text
        while '\n' in self.pending:
            line,self.pending=self.pending.split('\n',1);_output(line)
        return len(text)
    def flush(self):
        if self.pending:_output(self.pending);self.pending=''

def _run_child(source):
    oldout,olderr=_sys.stdout,_sys.stderr;out=_Output();_sys.stdout=out;_sys.stderr=out
    try:
        tree=_Evidence().visit(_ast.parse(source,filename='YourCode.py'));_ast.fix_missing_locations(tree)
        scope={'__name__':'__main__','game':_Game(),'_cq_trace':_trace,'_cq_mark':_mark}
        exec(compile(tree,'YourCode.py','exec'),scope,scope)
        out.flush()
        return ''
    except BaseException as e:
        line=getattr(e,'lineno',None)
        if not line:
            child=[f.lineno for f in _tb.extract_tb(e.__traceback__) if f.filename=='YourCode.py'];line=child[-1] if child else None
        return (f'Line {line}: ' if line else '')+type(e).__name__+': '+str(e)
    finally:_sys.stdout=oldout;_sys.stderr=olderr
