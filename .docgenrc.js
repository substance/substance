module.exports = {
  title: 'Substance',
  // landing page
  index: 'README.md',
  // This will be used to create links to source files within the API docs
  repository: "https://github.com/substance/substance",
  sha: "develop",
  content: [
    { type: "page", id: "about", title: "About", src: "doc/about.md" },
    { type: "section", id: "readme", title: "Readme", src: "README.md" },
    { type: "section", id: "changelog", title: "Changelog", src: "CHANGELOG.md" },
    { type: "page", id: "guides", title: "Guides", src: "doc/guides.md" },
    { type: "section", id: "getting_started", title: "Getting Started", src: "doc/getting-started.md" },
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
