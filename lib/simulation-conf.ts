interface Window {
  phet: any
}

window.phet = window.phet || {};
window.phet.preloads = {}
window.phet.chipper = window.phet.chipper || {};
window.phet.chipper.packageObject = {
  name: "circuit-construction-kit-dc",
  version: "1.6.0-dev.0",
  license: "GPL-3.0",
  repository: {
    type: "git",
    url: "https://github.com/phetsims/circuit-construction-kit-dc.git",
  },
  devDependencies: {
    grunt: "~1.5.3",
  },
  phet: {
    requirejsNamespace: "CIRCUIT_CONSTRUCTION_KIT_DC",
    licenseKeys: ["ngspice-wasm-2025.js", "ngspice-emscripten-glue-2025.js"],
    phetLibs: ["circuit-construction-kit-common", "twixt", "griddle", "bamboo"],
    runnable: true,
    supportedBrands: ["phet", "adapted-from-phet", "phet-io"],
    simulation: true,
    simFeatures: {
      supportsSound: true,
      supportsDynamicLocale: true,
      supportsInteractiveDescription: true,
    },
    supportsOutputJS: true,
    published: true,
    "phet-io": {
      compareDesignedAPIChanges: true,
      wrappers: [
        "phet-io-sim-specific/repos/circuit-construction-kit-dc/wrappers/codap",
        "phet-io-sim-specific/repos/circuit-construction-kit-dc/wrappers/statistics-integration",
      ],
    },
    screenNameKeys: [
      "CIRCUIT_CONSTRUCTION_KIT_DC/screen.intro",
      "CIRCUIT_CONSTRUCTION_KIT_DC/screen.lab",
    ],
  },
};
window.phet.chipper.stringRepos = [
  {
    repo: "bamboo",
    requirejsNamespace: "BAMBOO",
  },
  {
    repo: "circuit-construction-kit-common",
    requirejsNamespace: "CIRCUIT_CONSTRUCTION_KIT_COMMON",
  },
  {
    repo: "circuit-construction-kit-dc",
    requirejsNamespace: "CIRCUIT_CONSTRUCTION_KIT_DC",
  },
  {
    repo: "griddle",
    requirejsNamespace: "GRIDDLE",
  },
  {
    repo: "joist",
    requirejsNamespace: "JOIST",
  },
  {
    repo: "scenery-phet",
    requirejsNamespace: "SCENERY_PHET",
  },
  {
    repo: "sun",
    requirejsNamespace: "SUN",
  },
  {
    repo: "tambo",
    requirejsNamespace: "TAMBO",
  },
  {
    repo: "twixt",
    requirejsNamespace: "TWIXT",
  },
];
window.phet.chipper.allowLocaleSwitching = true;
window.phet.chipper.stringPath = "/json//";
// window.phet.chipper.loadModules = () =>
//   import("../public/js/circuit-construction-kit-dc/js/circuit-construction-kit-dc-main.js");
// window.phet.chipper.loadModules = () => {};
window.phet.brand = {
  splash: "/splash.svg",
};

const preloads = [
  "/js/joist/js/splash.js",
  "/js/sherpa/lib/lodash-4.17.4.js",
  "/js/sherpa/lib/FileSaver-b8054a2.js",
  "/js/sherpa/lib/linebreak-1.1.0.js",
  "/js/sherpa/lib/flatqueue-1.2.1.js",
  "/js/sherpa/lib/paper-js-0.12.17.js",
  "/js/sherpa/lib/he-1.1.1.js",
  "/js/assert/js/assert.js",
  "/js/query-string-machine/js/QueryStringMachine.js",
  "/js/chipper/js/browser/initialize-globals.js",
  "/js/sherpa/lib/seedrandom-2.4.2.js",
  "/js/sherpa/lib/base64-js-1.2.0.js",
  "/js/sherpa/lib/TextEncoderLite-3c9f6f0.js",
];

const loadURL = (preloadURL: string, type = "text/javascript") => {
  const script = document.createElement("script");
  script.type = type;
  script.src = preloadURL;
  script.async = false;
  document.head.appendChild(script);
};
// const loadURL = (preloadURL: string, type = "text/javascript") => {
//   import(`../public${preloadURL}`)
// };

loadURL("/js/chipper/js/browser/load-unbuilt-strings.js");
preloads.forEach((preload) => loadURL(preload));
window.phet.chipper.loadModules = () =>
  loadURL(
    "/js/circuit-construction-kit-dc/js/circuit-construction-kit-dc-main.js",
    "module",
  );
