<h1 align="center">
  <br>
    <img src="https://github.com/firefox-devtools/vscode-firefox-debug/blob/master/icon.png?raw=true" alt="logo" width="200">
  <br>
  VS Code Debugger for Firefox
  <br>
  <br>
</h1>

<h4 align="center">Debug your JavaScript code running in Firefox from VS Code.</h4>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=firefox-devtools.vscode-firefox-debug"><img src="https://vsmarketplacebadge.apphb.com/version/firefox-devtools.vscode-firefox-debug.svg?label=Debugger%20for%20Firefox" alt="Marketplace bagde"></a>
</p>

A VS Code extension to debug web applications and extensions running in the [Mozilla Firefox browser](https://www.mozilla.org/en-US/firefox/developer/?utm_medium=vscode_extension&utm_source=devtools). [📦 Install from VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=firefox-devtools.vscode-firefox-debug).

### Supported features

* Pause [breakpoints](https://code.visualstudio.com/docs/editor/debugging#_breakpoints), including advanced [conditional](https://code.visualstudio.com/docs/editor/debugging#_conditional-breakpoints) and [inline](https://code.visualstudio.com/docs/editor/debugging#_inline-breakpoints) modes
* Pause on object property changes with [Data breakpoints](https://code.visualstudio.com/docs/editor/debugging#_data-breakpoints)
* Inject logging during debugging using [logpoints](https://code.visualstudio.com/docs/editor/debugging#_logpoints)
* Debugging eval scripts, script tags, and scripts that are added dynamically and/or source mapped
* *Variables* pane for inspecting and setting values
* *Watch* pane for evaluating and watching expressions
* *Console* for logging and REPL
* Debugging Firefox extensions
* Debugging Web Workers
* Compatible with [remote development](https://code.visualstudio.com/docs/remote/remote-overview)

## Getting Started

You can use this extension in **launch** or **attach** mode.

In **launch** mode it will start an instance of Firefox navigated to the start page of your application
and terminate it when you stop debugging. You can also set the `reAttach` option in your launch configuration to `true`, in this case Firefox won't be terminated at the end of your debugging session and the debugger will re-attach to it when
you start the next debugging session - this is a lot faster than restarting Firefox every time. `reAttach` also works for WebExtension debugging: in this case, the WebExtension is (re-)installed as a [temporary add-on](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Temporary_Installation_in_Firefox).

In **attach** mode the extension connects to a running instance of Firefox (which must be manually
configured to allow remote debugging - see [below](#attach)).

To configure these modes you must create a file `.vscode/launch.json` in the root directory of your
project. You can do so manually or let VS Code create an example configuration for you by clicking 
the gear icon at the top of the Debug pane.

Finally, if `.vscode/launch.json` already exists in your project, you can open it and add a 
configuration snippet to it using the *"Add Configuration"* button in the lower right corner of the
editor.

### Launch
Here's an example configuration for launching Firefox navigated to the local file `index.html` 
in the root directory of your project:
```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Launch index.html",
            "type": "firefox",
            "request": "launch",
            "reAttach": true,
            "file": "${workspaceFolder}/index.html"
        }
    ]
}
```

You may want (or need) to debug your application running on a Webserver (especially if it interacts
with server-side components like Webservices). In this case replace the `file` property in your
`launch` configuration with a `url` and a `webRoot` property. These properties are used to map
urls to local files:
```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Launch localhost",
            "type": "firefox",
            "request": "launch",
            "reAttach": true,
            "url": "http://localhost/index.html",
            "webRoot": "${workspaceFolder}"
        }
    ]
}
```
The `url` property may point to a file or a directory, if it points to a directory it must end with
a trailing `/` (e.g. `http://localhost/my-app/`).
You may omit the `webRoot` property if you specify the `pathMappings` manually. For example, the
above configuration would be equivalent to
```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Launch localhost",
            "type": "firefox",
            "request": "launch",
            "reAttach": true,
            "url": "http://localhost/index.html",
            "pathMappings": [{
                "url": "http://localhost",
                "path": "${workspaceFolder}"
            }]
        }
    ]
}
```
Setting the `pathMappings` manually becomes necessary if the `url` points to a file or resource in a
subdirectory of your project, e.g. `http://localhost/login/index.html`.

### Attach
To use attach mode, you have to launch Firefox manually from a terminal with remote debugging enabled.
Note that if you don't use Firefox Developer Edition, you must first configure Firefox to allow
remote debugging. To do this, open the Developer Tools Settings and check the checkboxes labeled
"Enable browser chrome and add-on debugging toolboxes" and "Enable remote debugging"
(as described [here](https://developer.mozilla.org/en-US/docs/Tools/Remote_Debugging/Debugging_Firefox_Desktop#Enable_remote_debugging)).
Alternatively you can set the following values in `about:config`:

Preference Name                       | Value   | Comment
--------------------------------------|---------|---------
`devtools.debugger.remote-enabled`    | `true`  | Required
`devtools.chrome.enabled`             | `true`  | Required
`devtools.debugger.prompt-connection` | `false` | Recommended
`devtools.debugger.force-local`       | `false` | Set this only if you want to attach VS Code to Firefox running on a different machine (using the `host` property in the `attach` configuration)

Then close Firefox and start it from a terminal like this:

__Windows__

`"C:\Program Files\Mozilla Firefox\firefox.exe" -start-debugger-server`

(This syntax is for a regular command prompt (cmd.exe), not PowerShell!)

__OS X__

`/Applications/Firefox.app/Contents/MacOS/firefox -start-debugger-server`

__Linux__

`firefox --start-debugger-server`

Navigate to your web application and use this `launch.json` configuration to attach to Firefox:
```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Launch index.html",
            "type": "firefox",
            "request": "attach"
        }
    ]
}
```

If your application is running on a Webserver, you need to add the `url` and `webRoot` properties
to the configuration (as in the second `launch` configuration example above).

### Skipping ("blackboxing") files
You can tell the debugger to ignore certain files while debugging: When a file is ignored, the
debugger won't break in that file and will skip it when you're stepping through your code. This is
the same as "black boxing" scripts in the Firefox Developer Tools.

There are two ways to enable this feature:
* You can enable/disable this for single files while debugging by choosing "Toggle skipping this file"
  from the context menu of a frame in the call stack.
* You can use the `skipFiles` configuration property, which takes an array of glob patterns
  specifying the files to be ignored.
  If the URL of a file can't be mapped to a local file path, the URL will be matched against these
  glob patterns, otherwise the local file path will be matched.
  Examples for glob patterns:
  * `"${workspaceFolder}/skipThis.js"` - will skip the file `skipThis.js` in the root folder of your project
  * `"**/skipThis.js"` - will skip files called `skipThis.js` in any folder
  * `"**/node_modules/**"` - will skip all files in `node_modules` folders anywhere in the project
  * `"http?(s):/**"` - will skip files that could not be mapped to local files
  * `"**/google.com/**"` - will skip files containing `/google.com/` in their url, in particular
    all files from the domain `google.com` (that could not be mapped to local files)

### Path mapping
The debug adapter needs to map the URLs of javascript files (as seen by Firefox) to local file paths
(as seen by VS Code). It creates a set of default path mappings from the configuration that work
for most projects. However, depending on the setup of your project, they may not work for you,
resulting in breakpoints being shown in gray (and Firefox not breaking on them) even after Firefox
has loaded the corresponding file. In this case, you will have to define them manually using the
`pathMappings` configuration property.

The easiest way to do this is through the Path Mapping Wizard: when you try to set a breakpoint 
during a debug session in a file that couldn't be mapped to a URL, the debug adapter will offer to
automatically create a path mapping for you. If you click "Yes" it will analyze the URLs loaded by
Firefox and try to find a path mapping that maps this file and as many other workspace files as
possible to URLs loaded by Firefox and it will add this mapping to your debug configuration.
Note that this path mapping is just a guess, so you should check if it looks plausible to you.
You can also call the Path Mapping Wizard from the command palette during a debug session.

You can look at the Firefox URLs and how they are mapped to paths in the Loaded Scripts Explorer,
which appears at the bottom of the debug side bar of VS Code during a debug session.
By choosing "Map to local file" or "Map to local directory" from the context menu of a file or
a directory, you can pick the corresponding local file or directory and a path mapping will
automatically be added to your configuration.

If you specify more than one mapping, the first mappings in the list will take precedence over
subsequent ones and all of them will take precedence over the default mappings.

The most common source of path mapping problems is webpack because the URLs that it generates
depend on its configuration and different URL styles are in use. If your configuration contains a
`webroot` property, the following mappings will be added by default in order to support most webpack
setups:
```
{ "url": "webpack:///~/", "path": "${webRoot}/node_modules/" }
{ "url": "webpack:///./~/", "path": "${webRoot}/node_modules/" }
{ "url": "webpack:///./", "path": "${webRoot}/" }
{ "url": "webpack:///src/", "path": "${webRoot}/src/" }
{ "url": "webpack:///node_modules/", "path": "${webRoot}/node_modules/" }
{ "url": "webpack:///webpack", "path": null }
{ "url": "webpack:///(webpack)", "path": null }
{ "url": "webpack:///pages/", "path": "${webRoot}/pages/" }
{ "url": "webpack://[name]_[chunkhash]/node_modules/", "path": "${webRoot}/node_modules/" }
{ "url": "webpack://[name]_[chunkhash]/", "path": null }
{ "url": "webpack:///", "path": "" }
```

When the `path` argument of a mapping is set to `null`, the corresponding URLs are prevented from
being mapped to local files. In the webpack mappings shown above this is used to specify that
URLs starting with `webpack:///webpack` or `webpack:///(webpack)` do not correspond to files in
your workspace (because they are dynamically generated by webpack). It could also be used for URLs
that dynamically generate their content on the server (e.g. PHP scripts) or if the content on the
server is different from the local file content. For these URLs the debugger will show the content
fetched from the server instead of the local file content.

You can also use `*` as a wildcard in the `url` of a pathMapping. It will match any number of
arbitrary characters except `/`.

### Debugging WebExtensions
Here's an example configuration for WebExtension debugging:
```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Launch WebExtension",
            "type": "firefox",
            "request": "launch",
            "reAttach": true,
            "addonPath": "${workspaceFolder}"
        }
    ]
}
```
The `addonPath` property must be the absolute path to the directory containing `manifest.json`.

You can reload your WebExtension using the command "Firefox: Reload add-on" (`extension.firefox.reloadAddon`)
from the VS Code command palette.
The WebExtension will also be reloaded when you restart the debugging session, unless you have set
`reloadOnAttach` to `false`.
You can also use the `reloadOnChange` property to let VS Code reload your WebExtension automatically
whenever you change a file.

You can enable/disable/toggle popup auto-hide using the commands "Firefox: Enable/Disable/Toggle
popup auto-hide" (`extension.firefox.enablePopupAutohide` / `disablePopupAutohide` / `togglePopupAutohide`).

### Further optional configuration properties
* `reAttach`: If you set this option to `true` in a `launch` configuration, Firefox won't be 
  terminated at the end of your debugging session and the debugger will re-attach to it at the
  start of your next debugging session.
* `reloadOnAttach`: This flag controls whether the web page(s) should be automatically reloaded
  after attaching to Firefox. The default is to reload in a `launch` configuration with the
  `reAttach` flag set to `true` and to not reload in an `attach` configuration.
* `reloadOnChange`: Automatically reload the Firefox tabs or your WebExtension whenever files change.
  You can specify single files, directories or glob patterns to watch for file changes and
  additionally specify files to be ignored. Since watching files consumes system resources,
  make sure that you are not watching more files than necessary.
  The following example will watch all javascript files in your workspace except those under
  `node_modules`:
  ```json
    "reloadOnChange": {
        "watch": [ "${workspaceFolder}/**/*.js" ],
        "ignore": [ "${workspaceFolder}/node_modules/**" ]
    }
  ```
  By default, the reloading will be "debounced": the debug adapter will wait until the last file
  change was 100 milliseconds ago before reloading. This is useful if your project uses a build
  system that generates multiple files - without debouncing, each file would trigger a separate
  reload. You can use `reloadOnChange.debounce` to change the debounce time span or to disable
  debouncing (by setting it to `0` or `false`).

  Instead of string arrays, you can also use a single string for `watch` and `ignore` and if you
  don't need to specify `ignore` or `debounce`, you can specify the `watch` value directly, e.g.
  ```json
  "reloadOnChange": "${workspaceFolder}/lib/*.js"
  ```
* `tabFilter`: Only attach to Firefox tabs with matching URLs. You can specify one or more URLs to
  include and/or URLs to exclude and the URLs can contain `*` wildcards.
  By default, a `tabFilter` is constructed from the `url` in your `launch` or `attach` configuration
  by replacing the last path segment with `*`. For example, if your configuration contains
  `"url": "http://localhost:3000/app/index.html"`, the default `tabFilter` will be
  `"http://localhost:3000/app/*"`.
* `clearConsoleOnReload`: Clear the debug console in VS Code when the page is reloaded in Firefox.
* `tmpDir`: The path of the directory to use for temporary files
* `profileDir`, `profile`: You can specify a Firefox profile directory or the name of a profile
  created with the Firefox profile manager. The extension will create a copy of this profile in the
  system's temporary directory and modify the settings in this copy to allow remote debugging.
  You can also override these properties in your settings (see below). The default profile names
  used by Firefox are `default`, `dev-edition-default` and `default-nightly` for the stable,
  developer and nightly editions, respectively.
* `keepProfileChanges`: Use the specified profile directly instead of creating a temporary copy.
  Since this profile will be permanently modified for debugging, you should only use this option
  with a dedicated debugging profile. You can also override this property in your settings (see below).
* `port`: Firefox uses port 6000 for the debugger protocol by default. If you want to use a different
  port, you can set it with this property. You can also override this property in your settings
  (see below).
* `timeout`: The timeout in seconds for the adapter to connect to Firefox after launching it.
* `firefoxExecutable`: The absolute path to the Firefox executable or the name of a Firefox edition
  (`stable`, `developer` or `nightly`) to look for in its default installation path. If not specified,
  this extension will look for both stable and developer editions of Firefox; if both are available,
  it will use the developer edition. You can also override this property in your settings (see below).
* `firefoxArgs`: An array of additional arguments used when launching Firefox (`launch` configuration only).
  You can also override this property in your settings (see below).
* `host`: If you want to debug with Firefox running on a different machine, you can specify the 
  device's address using this property (`attach` configuration only).
* `log`: Configures diagnostic logging for this extension. This may be useful for troubleshooting
  (see below for examples).
* `showConsoleCallLocation`: Set this option to `true` to append the source location of `console`
  calls to their output
* `preferences`: Set additional Firefox preferences in the debugging profile
* `popupAutohideButton`: Show a button in the status bar for toggling popup auto-hide
  (enabled by default when debugging a WebExtension)
* `liftAccessorsFromPrototypes`: If there are accessor properties (getters and setters) defined
  on an object's prototype chain, you can "lift" them so they are displayed on the object itself.
  This is usually necessary in order to execute the getters, because otherwise they would be
  executed with `this` set to the object's prototype instead of the object itself. This property
  lets you set the number of prototype levels that should be scanned for accessor properties to lift.
  Note that this will slow the debugger down, so it's set to `0` by default.
* `suggestPathMappingWizard`: Suggest using the Path Mapping Wizard when you try to set a
  breakpoint in an unmapped source during a debug session. You may want to turn this off if some
  of the sources in your project are loaded on-demand (e.g. if you create multiple bundles with
  webpack and some of these bundles are only loaded as needed).
* `enableCRAWorkaround`: Enable a workaround for facebook/create-react-app#6074: Adding/removing
  breakpoints doesn't work for sources that were changed after the dev-server was started

### Overriding configuration properties in your settings
You can override some of the `launch.json` configuration properties in your user, workspace or
folder settings. This can be useful to make machine-specific changes to your launch configuration
without sharing them with other users.

This setting                 | overrides this `launch.json` property
-----------------------------|-------------------------------------
`firefox.executable`         | `firefoxExecutable`
`firefox.args`               | `firefoxArgs`
`firefox.profileDir`         | `profileDir`
`firefox.profile`            | `profile`
`firefox.keepProfileChanges` | `keepProfileChanges`
`firefox.port`               | `port`

### Diagnostic logging
The following example for the `log` property will write all log messages to the file `log.txt` in
your workspace:
```json
...
    "log": {
        "fileName": "${workspaceFolder}/log.txt",
        "fileLevel": {
            "default": "Debug"
        }
    }
...
```

This example will write all messages about conversions from URLs to paths and all error messages
to the VS Code console:
```json
...
    "log": {
        "consoleLevel": {
            "PathConversion": "Debug",
            "default": "Error"
        }
    }
...
```
 
## Troubleshooting
* Breakpoints that should get hit immediately after the javascript file is loaded may not work the
  first time: You will have to click "Reload" in Firefox for the debugger to stop at such a
  breakpoint. This is a weakness of the Firefox debug protocol: VS Code can't tell Firefox about
  breakpoints in a file before the execution of that file starts.
* If your breakpoints remain unverified after launching the debugger (i.e. they appear gray instead
  of red), the conversion between file paths and urls may not work. The messages from the 
  `PathConversion` logger may contain clues how to fix your configuration. Have a look at the 
  "Diagnostic Logging" section for an example how to enable this logger.
* If you think you've found a bug in this adapter please [file a bug report](https://github.com/firefox-devtools/vscode-firefox-debug/issues).
  It may be helpful if you create a log file (as described in the "Diagnostic Logging" section) and
  attach it to the bug report.
