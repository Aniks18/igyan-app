# IGYAN AI mobile design

## Purpose and audience
The Expo app serves learners, families, teachers, and institutions. Adapt the
IGYAAN web identity to native screens and touch navigation.

## Reference and direction
Use Aniks18/IGYAAN, commit 8990825a6d1a5715bc6ff90b5b6900aa53ccbea0,
`igyan-mvp`. The multicolour people-and-star mark is the signature. Keep surfaces
quiet, typography legible, and blue/indigo actions consistent with the web UI.
Do not substitute generic school or star icons for the brand.

## Runtime ownership
`constants/githubUI.js` owns imported palette values: background #f5f8ff,
surface #ffffff, heading #0f2444, muted #476b9c, primary #4f46e5, blue #0955b9.
`constants/theme.js` remains the general native theme. This branding update does
not introduce a second theme or alter semantic status colours.

`components/BrandLogo.js` owns in-app brand rendering using
`assets/brand/igyan-ai-mark.png`, copied unchanged from the web repository.
Its native size variants are hero 200, header 48, sidebar 44, card 64, compact 40.
Headers may use an explicit smaller size to preserve the school name and controls.
The optional wordmark uses native system type at 24px / weight 800.

## Layout and accessibility
Preserve safe areas, scrolling, screen titles, profile images, and existing routes.
Reserve square logo geometry and use contain sizing to preserve aspect ratio.
Expose the logo as one labelled image; navigation controls have explicit names.
Native typography follows the existing system font setup.

## Scope and verification
The current pass unifies in-app branding across welcome, workspace selection,
sign-in, signup, shared header, and navigation drawer. Launcher and native splash
assets have a separate platform build pipeline and are not changed in this pass.
Static JSX/import and whitespace checks do not establish simulator visual fidelity.
