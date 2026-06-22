# MVVM Architecture

KumaraMarket.nz uses a gradual MVVM structure so the existing UI can keep working while feature areas are made easier to maintain.

## Folder Roles

- `src/features/<feature>/model`: domain types, feature state shapes, and data contracts.
- `src/features/<feature>/view-model`: pure state derivation, filtering, sorting, validation mapping, and route/query normalization.
- `src/components/<feature>`: React views. These should focus on rendering and user events, then delegate calculations to view-model functions.
- `src/lib`: shared infrastructure such as persistence, auth, i18n, notifications, distance calculations, and stores.
- `src/app`: route composition. Pages load server data and pass it to views or feature view-model entry points.

## Marketplace Pilot

The marketplace board now has the first MVVM split:

- Model: `src/features/marketplace/model/marketplace.model.ts`
- ViewModel: `src/features/marketplace/view-model/marketplace-board.vm.ts`
- View: `src/components/marketplace/MarketplaceBoard.tsx`

The view-model owns:

- menu normalization from URL values
- menu slug generation
- search, seller, region, Hamilton suburb, item category, status, and distance filtering
- marketplace sorting
- right-rail popular post selection
- distance filter option selection

The view keeps:

- local UI state
- event handlers
- JSX layout
- translated display labels

## Collaboration Rules

1. Add new business rules to a feature view-model first.
2. Keep persisted Korean enum values stable until a real migration exists.
3. Translate display labels at the view edge instead of changing stored values.
4. Keep API/store code in `src/lib` unless it becomes feature-specific enough to move under `src/features/<feature>/data`.
5. When adding a new feature, create `model` and `view-model` folders before the component grows large.
