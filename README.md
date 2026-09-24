# Sean McKee — portfolio

A static Jekyll user site for **https://smckee12.github.io**, intended to publish directly from this repository’s `main` branch and `/` (root) folder on GitHub Pages. No JavaScript build, package manager, backend, or manual deployment step is required.

## Publish on GitHub Pages

1. Create a repository named **`smckee12.github.io`** in the `smckee12` GitHub account, if it does not already exist.
2. Push **the contents of this repository's root** to its `main` branch. Do not copy a subfolder or publish a `dist` directory.
3. In the repository settings, select **Pages → Build and deployment → Deploy from a branch → `main` → `/ (root)`** and save. GitHub Pages runs Jekyll automatically.
4. Visit `https://smckee12.github.io` after Pages finishes publishing. DNS propagation and the first Pages build can take a few minutes.

`_config.yml` sets `url` to `https://smckee12.github.io` and keeps `baseurl` empty. Internal links and assets use Jekyll’s `relative_url` filter; the `jekyll-seo-tag` and `jekyll-sitemap` plugins are supported by GitHub Pages.

## Update content

- `index.md`, `about.md`, `experience.md`, and `contact.md` hold the page content. Each begins with YAML front matter (`layout`, `title`, `description`, `permalink`).
- Shared navigation and footer live in `_includes/`; the document shell and SEO hook live in `_layouts/default.html`.
- Edit visual styles in `assets/css/style.css`. Light and dark follow the visitor’s system setting unless they use the theme button. The button stores the choice in the browser.
- Photos live in `assets/images/`; credit and license details are in `licenses.md`. Only replace photos with images whose reuse rights you have checked. They are illustrative, not documentation of Sean’s own work.
- The email address in `contact.md` is intentionally public and opens the visitor’s configured email app. Change or remove it there if you no longer want it published.
- Update `title`, `description`, `url`, and `baseurl` in `_config.yml` if the site moves. A user site at `smckee12.github.io` uses an empty `baseurl`.

## Preview locally

Install Ruby and Bundler on your own computer, then run `gem install bundler jekyll jekyll-seo-tag jekyll-sitemap` and `jekyll serve`. Open `http://localhost:4000`. This is optional for editing and is not needed for GitHub Pages to build the site.

## Check quality

In Chrome, open the deployed page, then DevTools → **Lighthouse** → select **Performance, Accessibility, Best Practices, SEO** → run a navigation report for mobile and desktop. Aim for at least 90 in each category. Repeat for Home, About, Experience, and Contact. Verify page links and try the 375px and 1280px responsive widths in DevTools. Since Lighthouse results depend on the network and browser environment, recheck after changing images, CSS, or third-party resources.