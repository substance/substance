module.exports = {
  title: 'Substance',
  // landing page
  index: 'README.md',
  // This will be used to create links to source files within the API docs
  repository: "https://github.com/substance/substance",
  sha: "develop",
  content: [
    { type: "page", id: "about", title: "About", src: "doc/about.md" },
    { type: "section", id: "quickstart", title: "Quickstart", src: "doc/quickstart.md" },
    { type: "section", id: "changelog", title: "Changelog", src: "CHANGELOG.md" },
    { type: "section", id: "license", title: "License", src: "LICENSE.md" },
    { type: "page", id: "guides", title: "Guides", src: "doc/guides.md" },
    { type: "section", id: "your-first-editor", title: "Your first Substance editor", src: "doc/your-first-editor.md" },
    { type: "section", id: "integrating-substance", title: "Integrating Substance", src: "doc/integrating-substance.md" },
    { type: "api", id: "api", title: "API" ,
      files: [
        // "model/documentHelpers.js",
        "model/**/*.js",
        "packages/**/*.js",
        "ui/*.js",
        "util/*.js"
      ]
    }
  ],
  defaultPage: 'about'
}
