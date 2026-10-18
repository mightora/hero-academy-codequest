# Hero Academy CodeQuest

An adventure about bringing an island world back to life with instructions and code. The original Hero Academy hero and Pip return, with the Reading game's cream, teal, green, orange and gold visual identity.

## What is implemented

- **30 selectable coding missions:** F1–F10 foundations, P11–P20 Python and C11–C20 C#.
- Four deterministic, solvable variants per mission. Routes, quantities, destinations, object positions or repair goals change.
- Interactive island maps, a Python/C# branching screen and a sandbox for each path. Nothing is locked.
- Tap and keyboard friendly instruction blocks with nesting, replacement, ordering and accurately labelled pseudocode.
- Editable **CPython 3.14.2** through **Pyodide 314.0.7**.
- Editable **C# 13**, compiled by **Roslyn 4.14.0**, then executed by the **.NET 10.0.13 WebAssembly interpreter**. The compiler host is prebuilt; the child's program is compiled from the edited source on Run.
- Run, Stop, Reset, Step through game actions, progressive hints, supplied examples and an accessible native text editor.
- Star catching, robot trail exploration, memory matching and a glider course. These are additional play, not coding levels.
- Named local heroes with separate code, progress, rewards, appearance, settings and practice records.
- Validated export/import backups, large text, reduced motion and quiet play with speech only after Hear.

## Run or deploy

The complete web application is in **`dist/`**, including the language engines. There is no server, API key, external compiler service, runtime CDN or build step required to host it.

For local development, serve the directory over HTTP, for example:

```sh
python3 -m http.server 8080 --directory dist
```

Then open `http://localhost:8080`. Opening `index.html` directly using `file://` is not supported.

For GitHub Pages:

1. Put this source in a repository with a `main` branch.
2. Under **Settings → Pages**, select **GitHub Actions** as the source.
3. Push `main`, or run the included **Deploy CodeQuest to GitHub Pages** workflow.
4. In **Settings → Pages → Custom domain**, save **`codequest.heroacademy.app`**. The DNS CNAME points to `mightora.github.io` with DNS-only routing.
5. Enable **Enforce HTTPS** when GitHub has issued the certificate.

The Python standard-library ZIP is deliberately tracked alongside the WebAssembly runtime. Source downloads use GitHub’s repository archive.

The workflow tests the core and uploads `dist/`. Its asset paths also work under a repository subdirectory. Do not add `allow-same-origin` to the runtime iframe or relax its network policy to make a failing device load the runtime. Use the recovery controls and investigate the browser error.

Other static hosts can serve `dist/` unchanged. Keep `.mjs` and `.js` responses as JavaScript and `.wasm` as `application/wasm`. Individual assets are below 25 MiB. Neither SharedArrayBuffer nor COOP/COEP response headers are required. If adding a host-level CSP, ensure the isolated HTML document retains the policy in `isolate.html`; an additional policy must not block its inline bootstrap, module Blobs or WebAssembly compilation.

## Verification and limits

See [the test report](docs/TEST-REPORT.md) for exactly what ran. Automated checks execute actual Python and C# WebAssembly, all 120 worked variants, alternative solutions, errors, limits, Stop, backups and player separation. DOM integration tests exercise the menus and mission flows.

**Actual browser interaction, rendered phone/tablet/desktop layouts and physical iPhone Safari were not tested in this environment.** The responsive rules and SVG artwork were checked, but that is not device certification. Test the private build on the intended devices before a classroom or public rollout.

The editor runs synchronous Academy game programs. Browser-compatible standard language features are available; this is not a desktop Python/.NET development environment. External packages, native libraries, OS integration and asynchronous C# entry points are outside the supported game workflow. Step replays game actions, not source statements. Browser workers have no portable hard RAM quota; extremely allocation-heavy code can exhaust a device even with time limits.

Local profiles are not online accounts. They do not synchronise automatically. Export a backup before clearing site data or moving devices. Rewards celebrate play; practice records distinguish independent completion, hints and worked examples and do not claim mastery.

## Source and tests

```sh
npm ci
npm run build
npm run check
npm test
npm run test:runtime
node tests/python-wasm.mjs
node tests/csharp-wasm.mjs
node tests/dom-ui.mjs
node tests/worker-isolation.mjs
node tests/host-integration.mjs
```

The deployed game has no npm dependencies; the small dev dependencies support DOM/CSS checks.

To rebuild the C# compiler host, install a .NET 10 SDK and `wasm-tools`, then:

```sh
dotnet workload install wasm-tools
dotnet publish runtime/csharp -c Release -o runtime/publish
```

Copy the generated `runtime/csharp/bin/Release/net10.0/browser-wasm/AppBundle/_framework/` contents into `dist/runtimes/csharp/`, then run `npm run build` and the runtime tests. The supplied binaries are already built. This build used SDK 10.0.100 with `RuntimeFrameworkVersion=10.0.13`. A container-specific optional `CodeQuestInProcessTasks=true` property avoids an MSBuild task-host limitation in the build container; normal SDK installations should use the default task host.

## Reference documents

- [Runtime investigation, versions, sizes, isolation and limitations](docs/RUNTIMES.md)
- [Academy game API in Python and C#](docs/GAME-API.md)
- [Curriculum and challenge assessment](docs/CURRICULUM.md)
- [Actual test results and remaining device checks](docs/TEST-REPORT.md)
- [Hero Academy brand](BRAND.md)

Third-party notices are under `dist/licenses/`. Pyodide is MPL-2.0, CPython has its included PSF licence, and .NET/Roslyn are MIT licensed with third-party notices. Original Hero Academy branding and characters are retained from the supplied Reading reference. No new blanket open-source licence has been applied to the original game or artwork.
