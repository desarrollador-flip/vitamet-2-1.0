# AGENTS.md

## Purpose

This repository is intended to produce maintainable React websites efficiently with AI-assisted development.

Follow the existing architecture and conventions before introducing new patterns.

Prefer simple, explicit and maintainable solutions over unnecessary abstraction.

The generated code must remain easy for a human developer to understand, modify and extend after the implementation is complete.

---

# General principles

- Keep solutions simple.
- Do not overengineer.
- Do not create abstractions without a concrete need.
- Do not install dependencies unless the requested functionality genuinely requires them.
- Do not introduce libraries when the same result can reasonably be achieved with the existing stack.
- Do not invent features that were not requested.
- Do not add animations, interactions or functionality unless they are present in the requirements or references.
- Do not create files or folders merely to satisfy an architectural pattern.
- Do not create empty architectural folders.
- Preserve existing conventions when working on an established project.
- Inspect the existing project before implementing changes.
- Prefer modifying existing appropriate code over creating parallel implementations.
- Keep changes within the requested scope.
- Do not refactor unrelated code during a focused task.
- If an unrelated issue is discovered, mention it instead of fixing it unless it blocks the requested work.

---

# Stack

Unless the project explicitly specifies otherwise, the expected frontend stack is:

- React
- TypeScript
- CSS Modules

Use TypeScript correctly.

Avoid `any` unless there is a concrete reason and no reasonable typed alternative.

Do not add:

- Tailwind;
- Bootstrap;
- Sass;
- styled-components;
- UI libraries;
- icon libraries;
- animation libraries;

unless explicitly required by the project.

Always inspect `package.json` before assuming which dependencies are available.

---

# React architecture

## App.tsx

`App.tsx` is responsible for application-level composition.

Depending on the project, this can include:

- global providers;
- routing;
- Navbar;
- `<main>`;
- Footer.

Do not implement complete pages or page sections directly inside `App.tsx`.

For a typical multipage project, the expected conceptual structure is:

```text
App
├── Navbar
├── main
│   └── Routes
│       ├── HomePage
│       ├── OtherPage
│       └── ...
└── Footer
```

Navbar and Footer are global layout components and should be mounted from `App.tsx` when they are shared by the entire site.

Do not duplicate them inside individual pages.

Do not create `App.module.css` merely because `App.tsx` exists.

If the styles describe global document or application behavior, they belong in the global styles.

Create component-specific App styles only when `App.tsx` genuinely requires them.

---

# Pages

Page-level components belong in:

```text
src/components/pages/
```

Examples:

```text
HomePage.tsx
ServiciosPage.tsx
ContactoPage.tsx
```

Pages should primarily compose the sections that belong to that page.

Avoid placing the complete implementation of a large page directly inside the page component when it contains clearly independent sections.

---

# Page sections

Page-specific sections belong in:

```text
src/components/exports/<page>/
```

Examples:

```text
src/components/exports/home/
src/components/exports/servicios/
src/components/exports/contacto/
```

Each substantial visual or semantic section should normally be an independent component.

Do not split insignificant fragments into separate components merely to increase component count.

The goal is useful separation of responsibilities, not maximum fragmentation.

---

# Section naming

Full page sections inside:

```text
components/exports/<page>/
```

must use sequential names based on their visual order.

Format:

```text
<Page><number>.tsx
```

Examples:

```text
home/
├── Home1.tsx
├── Home2.tsx
├── Home3.tsx

servicios/
├── Servicios1.tsx
├── Servicios2.tsx

contacto/
├── Contacto1.tsx
```

The number represents the visual order of the section on that page.

Use descriptive names instead for reusable or functional components.

For example:

```text
Navbar.tsx
Footer.tsx
ContactForm.tsx
Button.tsx
```

Do not rename reusable or functional components to sequential page-section names.

---

# Common components

Components reused across multiple pages or representing global site elements belong in:

```text
src/components/common/
```

Examples include:

```text
Navbar.tsx
Footer.tsx
```

Do not place page-specific sections in `components/common`.

Do not create a reusable component for something that is only used once unless separating it provides a clear architectural or functional benefit.

---

# Repeated UI and data

When a section contains several elements with the same structure, prefer separating the data from the JSX and rendering the elements with `.map()`.

Typical examples include:

- cards;
- benefits;
- process steps;
- requirements;
- documentation lists;
- FAQ entries;
- contact methods;
- schedules;
- similar repeated content.

Prefer:

```tsx
const items = [
    {
        title: '...',
        description: '...',
    },
];

return items.map((item) => {
    // render item
});
```

over manually duplicating substantially identical JSX.

Keep data local to the component when it is only used there.

Do not create configuration files, shared types or abstractions solely because `.map()` is being used.

If repeated elements have genuinely different structures or behavior, do not force them into a common data model.

---

# Forms

Complete forms must be independent components.

Do not embed a substantial form directly inside a page section.

Form components belong in:

```text
src/components/form/
```

Example:

```text
src/components/form/ContactForm.tsx
```

A page section may compose the form:

```tsx
<ContactForm />
```

but should not contain the complete form implementation when the form represents its own responsibility.

Form-specific styles must be isolated in:

```text
src/styles/modules/form/
```

Example:

```text
src/styles/modules/form/contactForm.module.css
```

## Frontend form architecture

Unless the task explicitly requests a static visual prototype, forms should be implemented with a complete frontend architecture even when backend integration is outside the current scope.

This normally includes:

- controlled fields;
- form state;
- field validation;
- field-level errors;
- accessible error relationships;
- clearing a field error when that field is edited;
- submit validation;
- loading state prepared when future asynchronous submission is expected;
- reset behavior prepared for future successful submission.

Do not implement real backend, API, Supabase or external submission logic unless explicitly requested.

When backend integration is outside the task scope, isolate clearly the point inside the submit flow where the future integration should occur.

Do not simulate backend requests with artificial delays.

## Form hooks

When a form contains meaningful state or validation logic, extract that logic into a dedicated hook under:

```text
src/hooks/
```

Prefer a form-specific hook:

```text
useContactForm.ts
useQuoteForm.ts
useApplicationForm.ts
```

Do not create a generic `useForm` abstraction unless multiple forms actually share enough behavior to justify it.

Keep validation and state-management logic outside large JSX components when reasonably possible.

## Existing form infrastructure

Before implementing form controls, inspect the repository for existing:

- form components;
- hooks;
- datasets;
- select components;
- telephone components;
- loading indicators;
- validation helpers;
- form styles.

Reuse existing infrastructure when it already solves the required responsibility.

Do not create competing implementations of an existing reusable component.

## Reusable datasets

When a fixed dataset already exists in the repository, reuse it instead of duplicating the values.

Examples include:

- states;
- countries;
- categories;
- predefined options.

Transform the data locally to the format required by the component when the transformation is simple and only used there.

Do not create an additional abstraction solely for a trivial data transformation.

## Telephone fields

When `react-phone-input-2` is already part of the project and the design requires a telephone field, prefer the existing phone input implementation and its existing styles unless the task explicitly requires another solution.

Do not install an additional telephone library.

## Select fields

If the repository contains an existing reusable custom select, reuse it where the design requires equivalent behavior.

Do not recreate another custom select for the same responsibility.

Use a native `<select>` when it sufficiently satisfies the design and requirements and there is no reason to use a custom implementation.

## Validation and accessibility

Use:

- semantic labels;
- appropriate input types;
- `required` where applicable;
- `aria-invalid`;
- `aria-describedby`;
- accessible error messages.

Field errors should be associated with their corresponding controls.

When submission fails frontend validation, provide an accessible general indication when appropriate.

Form controls must maintain appropriate mobile usability.

For:

- `input`;
- `textarea`;
- `select`;
- custom inputs that ultimately render a text input;

do not use a font size below:

```css
font-size: 16px;
```

unless the project explicitly requires otherwise.

---

# Styles

## Global styles

Global styles belong in:

```text
src/styles/common/
```

This directory is reserved for genuinely global or shared styles such as:

- CSS variables;
- reset;
- typography;
- global layout behavior;
- shared document-level rules.

Examples:

```text
variables.css
reset.css
global.css
```

These files should be imported through:

```text
src/index.css
```

`index.css` acts as the global stylesheet entry point.

Global selectors such as:

```css
html {
}
body {
}
#root {
}
main {
}
```

belong in global styles when they describe application-wide behavior.

Global colors, typography tokens, spacing tokens and similar shared values should not be stored inside a page-specific CSS Module.

---

# CSS Modules

Component-specific styles must use CSS Modules.

All CSS Modules belong under:

```text
src/styles/modules/
```

Do not place CSS Modules inside:

```text
src/styles/common/
```

Organize page-specific modules by page.

Example:

```text
styles/
├── common/
│   ├── variables.css
│   ├── reset.css
│   └── global.css
│
└── modules/
    ├── Navbar.module.css
    ├── Footer.module.css
    │
    ├── home/
    │   ├── home1.module.css
    │   ├── home2.module.css
    │   └── home3.module.css
    │
    ├── servicios/
    │   ├── servicios1.module.css
    │   └── servicios2.module.css
    │
    └── form/
        └── ContactForm.module.css
```

Page-section CSS Modules should follow the same sequential naming convention as their corresponding components.

Example:

```text
Home1.tsx
→ home1.module.css

Servicios2.tsx
→ servicios2.module.css
```

Do not accumulate the styles for an entire multi-section page into a single CSS Module when the sections are already independent components.

---

# Project structure

Create directories only when the project needs them.

A project may eventually contain:

```text
src/
├── assets/
├── components/
│   ├── common/
│   ├── exports/
│   ├── form/
│   └── pages/
├── hooks/
├── styles/
│   ├── common/
│   └── modules/
├── types/
└── utils/
```

This is not a requirement to create every directory.

For example:

- do not create `hooks/` if there are no custom hooks;
- do not create `types/` if there are no shared types;
- do not create `utils/` if there are no utilities;
- do not create `assets/` if there are no local assets.

Architecture should grow from actual project requirements.

---

# HTML and accessibility

Use semantic HTML whenever appropriate.

Prefer elements such as:

- `header`;
- `nav`;
- `main`;
- `section`;
- `footer`;
- `button`;
- `form`;
- `label`;

over generic containers when they correctly represent the content.

Maintain a logical heading hierarchy.

Interactive elements must be keyboard accessible.

Maintain visible focus states.

Images must use appropriate alternative text.

Decorative visual elements should not create unnecessary accessibility noise.

Do not sacrifice semantic structure or accessibility for visual convenience.

---

# Responsive implementation

Responsive behavior must be intentionally implemented.

Do not assume responsive design consists only of stacking desktop elements vertically.

Consider:

- hierarchy;
- spacing;
- typography;
- element order;
- navigation;
- touch targets;
- content density;
- image behavior;
- component proportions.

Avoid:

- horizontal overflow;
- fixed widths that break small screens;
- oversized typography on mobile;
- controls extending outside the viewport.

When desktop and mobile visual references are provided, use both as implementation requirements.

Intermediate viewport behavior should be inferred reasonably from those references.

---

# Visual references

When visual references are provided:

- inspect them before implementing;
- treat them as the primary visual source of truth;
- reproduce their composition and hierarchy as closely as reasonably possible;
- infer responsive behavior from the available references;
- preserve consistency between sections and pages.

Pay attention to:

- spacing;
- alignment;
- typography hierarchy;
- proportions;
- colors;
- borders;
- radii;
- visual density;
- relationship between elements.

Do not invent significant sections or visual features that are absent from the references.

If something cannot be reproduced because a required asset or piece of information is missing, use the simplest reasonable fallback and report the limitation.

---

# Existing project behavior

Before implementing a task:

1. Inspect the relevant existing structure.
2. Inspect existing components that may affect the requested work.
3. Inspect existing styles and global conventions.
4. Inspect available dependencies before installing anything.
5. Understand the current implementation before modifying it.

Before creating a new reusable component, hook, utility or dataset, check whether the repository already contains an implementation for the same responsibility.

Prefer extending or reusing an appropriate existing implementation over creating a competing parallel solution.

When changing existing code:

- preserve unrelated behavior;
- preserve existing responsive behavior unless the task requires changing it;
- preserve accessibility;
- preserve existing visual behavior outside the requested scope.

Do not perform opportunistic refactors during focused tasks.

---

# Dependencies

Do not install dependencies automatically just because they make an implementation easier.

A dependency is justified when:

- the requested functionality genuinely requires it;
- implementing the functionality without it would introduce unnecessary complexity;
- or the project explicitly requests that dependency.

Before installing anything:

1. inspect existing dependencies;
2. determine whether the project already contains an appropriate solution;
3. use the existing solution when reasonable.

Do not replace existing project technology without explicit instruction.

---

# Validation

After implementation, when the project provides the corresponding scripts:

1. review the changes;
2. run lint;
3. run build;
4. run relevant tests when they exist;
5. correct errors introduced by the implementation.

Do not fix unrelated existing errors unless they prevent validation of the requested work.

If an unrelated existing error prevents successful validation, report it clearly.

---

# Final report

After completing a substantial implementation task, provide a concise report containing:

- files created;
- files modified;
- files removed when applicable;
- relevant architectural decisions;
- relevant decisions made when interpreting requirements or visual references;
- any requested behavior that could not be implemented exactly;
- lint result;
- build result;
- test result when applicable.

Do not continue making unrelated improvements after completing the requested task.
