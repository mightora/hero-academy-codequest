# Runtime investigation and implementation

Checked 17 October 2026. The decisions below combine upstream documentation, downloaded release assets and actual source-execution tests. Test timings are container measurements, not phone benchmarks.

## Options considered

| Approach | Editable source? | Static host? | Decision |
| --- | --- | --- | --- |
| CPython via Pyodide WebAssembly | Yes: the CPython parser, compiler and interpreter execute edited Python | Yes | Selected. Real Python, a usable standard library and the real `ast` module allow concept evidence without inventing a language parser. |
| A Python-to-JavaScript implementation or educational subset | Depends on the implementation and its documented compatibility | Often | Not selected. No claim has been made about an untested alternative's Python compatibility, size or device performance. |
| A precompiled .NET/Blazor application alone | It executes the application that was compiled before deployment | Yes | Insufficient for editable child C#. |
| Roslyn compiler hosted inside .NET WebAssembly, with the interpreter enabled | Yes: parse edited C#, emit a new IL assembly, load it and invoke its entry point | Yes | Selected and verified with edited programs, alternative solutions and a user-defined robot class. No server compiler is involved. |
| Remote Python/C# execution service | Yes, if provided by the service | Requires a backend | Not needed for this implementation. It would add account, privacy, operating-cost and server-sandbox responsibilities. |

Primary references:

- [Pyodide worker usage](https://pyodide.org/en/stable/usage/webworker.html)
- [Pyodide release deployment](https://pyodide.org/en/stable/usage/downloading-and-deploying.html)
- [Pyodide API, including module constructor and standard-library options](https://pyodide.org/en/stable/usage/api/js-api.html)
- [Pyodide Python compatibility](https://pyodide.org/en/stable/usage/wasm-constraints.html)
- [A source-compiling .NET WebAssembly example](https://github.com/ramyD/csharp-wasm-compiler)
- [Microsoft's browser support guidance](https://learn.microsoft.com/en-us/aspnet/core/blazor/supported-platforms?view=aspnetcore-10.0)
- [.NET 10 release metadata](https://builds.dotnet.microsoft.com/dotnet/release-metadata/10.0/releases.json), which identified 10.0.13 as the current runtime patch when checked

## Pinned versions and measured downloads

| Component | Delivered version | Licence | Loading |
| --- | --- | --- | --- |
| Pyodide | 314.0.7 | MPL-2.0 | Only when Python is opened |
| CPython | 3.14.2, reported by the actual bundled interpreter | Included PSF/third-party licence | Inside Pyodide |
| .NET browser WebAssembly runtime | 10.0.13 | MIT plus included notices | Only when C# is opened |
| Roslyn | Microsoft.CodeAnalysis.CSharp 4.14.0 | MIT | Inside the C# toolkit |
| C# language level | C# 13, explicitly selected in Roslyn | Compiler licence above | Each edited program is compiled on Run |

`dist/runtime-manifest.json` is generated from the actual file sizes. The Python toolkit is about **13.54 MB**, and the C# toolkit about **38.31 MB**, before HTTP transfer compression. Those totals include the shared world module and language binding files. They do not imply an exact network transfer size: server compression and HTTP cache state matter. Foundations and mini-games do not download either engine.

All engines are served from this site's own static directory. No profile, source code or command is sent to a compiler server. Six asset downloads run concurrently; progress reports completed bytes. Successful downloads are cached in memory for reuse during that page session, as well as any browser HTTP caching. Loading can be stopped, retried, or abandoned in favour of First steps.

Upstream licence texts and .NET third-party notices are included under `dist/licenses/`. The original upstream files are retained unchanged. Module instances have `import.meta.url` changed to an internal virtual URL during isolated loading so relative resource resolution works without a network origin. Upstream source is available at the linked release repositories:

- [Pyodide 314.0.7](https://github.com/pyodide/pyodide/tree/314.0.7)
- [CPython 3.14.2](https://github.com/python/cpython/tree/v3.14.2)
- [.NET runtime 10.0.13](https://github.com/dotnet/runtime/tree/v10.0.13)
- [Roslyn source](https://github.com/dotnet/roslyn)

## What happens on Run

Python source is parsed by CPython's real AST parser. A small AST transformation records executed constructs, then CPython compiles and executes the transformed source. This preserves Python syntax and execution; it is not a bespoke Python parser or a search for command words.

C# source is parsed by Roslyn. A syntax-tree transformation records executed constructs. Roslyn compiles the edited program, supplied `Game` API and declared global usings into a fresh IL assembly. The browser's .NET interpreter loads and executes that assembly. A user-defined class in C20 is created and called by the child's program. The precompiled host alone cannot solve the mission.

The supplied API makes synchronous calls into a pure world simulation in the worker. Sensors read the current simulated state, including changes made by earlier commands. Output and validated action records return to the page. The page replays those actions through the same simulation to animate the visible world and independently check the outcome. It never selects a prerecorded animation by matching source text.

Step compiles/interprets the whole program first, then advances through the resulting **game actions**. It does not single-step arbitrary source statements, variable assignments or compiler internals. The UI states this explicitly.

## Isolation and interruption

1. The host downloads only version-pinned local assets.
2. It loads `isolate.html` as a real static document in `<iframe sandbox="allow-scripts">`, without `allow-same-origin`. `srcdoc` is avoided because inherited host CSP would block its bootstrap.
3. The opaque document starts a classic Blob worker containing bundled engine modules. Browser module imports from opaque origins can fail or stall, so the bundle resolves engine imports from a fixed in-memory registry. It passes only engine assets and the selected challenge/program, not the local profile collection.
4. The isolated document's CSP has `default-src 'none'`, `connect-src 'none'`, script Blobs and WebAssembly compilation only. It has no `unsafe-eval` permission. Tests run the vendor browser branches in a VM with JavaScript string code generation disabled.
5. A worker-local byte provider fulfils only known virtual runtime-resource requests from memory. It does not make network requests. Engine modules are compiled into separate Python/C# classic worker bundles by `npm run build`; builds reject external module imports. HTTP, WebSocket and other external connections are blocked by CSP in the browser, in addition to the fetch guard.
6. A private MessageChannel carries only a bounded protocol. The page validates operation names, argument counts/types, ranges, lengths and returned action counts before replay.
7. Stop tells the independently responsive iframe to call `worker.terminate()`, then closes the channel and removes the frame. Successful/error results also dispose of the worker. Each run therefore gets a fresh user environment and generated assemblies do not accumulate across runs.

Limits:

| Limit | Value |
| --- | --- |
| Editable program | 32,768 characters |
| Game commands | 256 per run |
| Printed output | About 8,192 characters, also constrained by the command budget |
| Individual message argument | 240 characters |
| Command arguments | At most three validated primitive values |
| Execution after runtime signals execution | 5 seconds |
| C# compile/start phase | 30 seconds |
| Runtime bootstrap after asset download | 60 seconds |

The execution deadline starts once and cannot be extended by repeated phase messages. Run results cannot leave a worker running after the interface has stopped watching it. Stop also cancels loading, playback, celebration transitions and requested speech.

There is no standard browser API for a hard per-worker memory quota. Time limits and fresh workers contain common runaway programs, but a sufficiently allocation-heavy program can still exhaust a browser process. This is an educational local runner, not a security-reviewed hostile-code execution service or a tamper-proof assessment system.

## Browser and device suitability

Use a current browser with WebAssembly, SIMD, Wasm exception handling and module workers. Microsoft documents current Safari, Chrome, Edge and Firefox for its WebAssembly platform; that is upstream platform support, not evidence that this application's combination has passed on each device.

There is a known [WebKit issue reading Blobs created inside opaque workers](https://bugs.webkit.org/show_bug.cgi?id=258443). CodeQuest avoids that path: module Blobs are created by the containing opaque document and binary/ZIP resources are supplied directly as byte-backed Responses. [Earlier sandboxed-iframe Blob handling](https://bugs.webkit.org/show_bug.cgi?id=170075) was fixed upstream. These design changes reduce a known compatibility risk but do not prove iPhone support.

The desktop container measured roughly 1.7 seconds to start Python and around 2.1 seconds to start the C# browser-loader branch with assets already local. The first C# compile-and-run took about 1.3 seconds in the separate direct WebAssembly test. These are not network, low-end tablet or iPhone timings. See the generated JSON reports for exact runs.

Actual Safari, iOS, Android, Firefox, touch hardware and rendered responsive layouts were **not** exercised here. Keep the recovery path to foundations and test the deployed game on the intended devices. No minimum iOS version or verified physical iPhone claim is made.

## Supported-program boundaries

- Both paths use genuine language runtimes, not restricted home-made grammars.
- The Academy API is synchronous. Asynchronous C# entry points are explicitly rejected. Ordinary classes, methods, parameters, collections, loops, variables, arithmetic and choices are compiled and tested.
- Browser-compatible standard libraries are available within the bundled engines. Only documented metadata references are supplied for C# compilation. This is not a complete desktop SDK or arbitrary package playground.
- External packages/NuGet, OS files, native libraries, process creation and network services are not provided by the game.
- Python has the bundled standard library and the documented browser limitations; no package-loading service is enabled.
- Foundation blocks run their own documented instruction model. Their displayed pseudocode is explicitly not executable Python or C#.
