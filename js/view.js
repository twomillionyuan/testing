const renderActions = (actions) =>
  actions
    .map(
      (action) =>
        `<a class="button ${action.style}" href="${action.href}">${action.label}</a>`
    )
    .join("");

const renderStats = (stats) =>
  stats
    .map(
      (stat) =>
        `<div class="stat"><strong>${stat.value}</strong>${stat.label}</div>`
    )
    .join("");

const renderFeatures = (features) =>
  features
    .map(
      (feature) =>
        `<article class="feature-card"><h3>${feature.title}</h3><p>${feature.body}</p></article>`
    )
    .join("");

const renderTimeline = (items) =>
  items
    .map(
      (item) => `
      <div class="timeline-item">
        <span>${item.day}</span>
        <div>
          <strong>${item.title}</strong>
          <p>${item.body}</p>
        </div>
      </div>
    `
    )
    .join("");

export const renderLanding = (model) => {
  const container = document.createElement("div");
  container.className = "page";
  container.innerHTML = `
    <section class="hero reveal">
      <div>
        <div class="badge"><span>${model.hero.badgeDot}</span> ${model.hero.badgeText}</div>
        <h1>${model.hero.title}</h1>
        <p>${model.hero.body}</p>
        <div class="hero-actions">
          ${renderActions(model.hero.actions)}
        </div>
      </div>
      <div class="hero-card reveal delay-1">
        <h2 class="section-title">${model.hero.snapshot.title}</h2>
        <p>${model.hero.snapshot.body}</p>
        <div class="stat-grid">
          ${renderStats(model.hero.snapshot.stats)}
        </div>
      </div>
    </section>

    <section class="reveal delay-2">
      <h2 class="section-title">${model.features.title}</h2>
      <div class="feature-grid">
        ${renderFeatures(model.features.items)}
      </div>
    </section>

    <section class="reveal delay-3">
      <h2 class="section-title">${model.timeline.title}</h2>
      <div class="timeline">
        ${renderTimeline(model.timeline.items)}
      </div>
    </section>

    <section class="cta reveal delay-2">
      <div>
        <h2 class="section-title">${model.cta.title}</h2>
        <p>${model.cta.body}</p>
      </div>
      <div class="hero-actions">
        ${renderActions(model.cta.actions)}
      </div>
    </section>

    <footer class="footer">
      <span>${model.footer.left}</span>
      <span>${model.footer.right}</span>
    </footer>
  `;

  return container;
};
