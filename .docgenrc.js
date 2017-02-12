module.exports = {
  title: 'Substance',
  // landing page
  index: 'README.md',
  // This will be used to create links to source files within the API docs
  repository: "https://github.com/substance/substance",
  sha: "v1.0.0-beta.6",
  content: [
    { type: "page", id: "getting-started", title: "Getting started", src: "doc/getting-started.md" },
    { type: "section", id: "your-first-editor", title: "Your first editor", src: "doc/your-first-editor.md" },
    { type: "section", id: "integrating-substance", title: "Integration", src: "doc/integrating-substance.md" },
    { type: "api", id: "api", title: "API" , src: "doc/api.md",
      files: [
        "model/**/*.js",
        "packages/**/*.js",
        "ui/*.js",
        "util/*.js"
      ]
    }
  ],
  defaultPage: 'getting-started'
}
