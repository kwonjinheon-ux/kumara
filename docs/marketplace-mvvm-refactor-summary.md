# Marketplace MVVM Refactor Summary

## Purpose

The marketplace page was reorganized toward an MVVM structure to make future maintenance and collaboration easier.

This first pass keeps the existing UI and behavior intact while separating marketplace business logic from React rendering code.

## What Changed

### Model

File:

- `src/features/marketplace/model/marketplace.model.ts`

Role:

- Defines marketplace menu types.
- Defines marketplace filter state.
- Defines the input/output shape expected by marketplace board view-model logic.

Key types:

- `MarketplaceMenu`
- `MarketplaceFilterState`
- `MarketplaceBoardViewModelInput`
- `MarketplaceBoardViewModel`

### ViewModel

File:

- `src/features/marketplace/view-model/marketplace-board.vm.ts`

Role:

- Owns marketplace filtering logic.
- Owns marketplace sorting logic.
- Normalizes URL menu values.
- Converts menu values into URL slugs.
- Selects right-rail popular posts.
- Selects available distance filter options.

Moved logic:

- Search filtering
- Seller filtering
- Board menu filtering
- Bookmark and my-listing filtering
- Hamilton suburb filtering
- Item category filtering
- Status filtering
- Distance filtering
- Popular/newest/price/comment/view sorting
- Marketplace menu slug mapping

### View

Files:

- `src/components/marketplace/MarketplaceBoard.tsx`
- `src/components/marketplace/MarketplaceSidebar.tsx`
- `src/app/marketplace/page.tsx`

Role:

- Keeps UI state.
- Handles user events.
- Renders JSX.
- Delegates data selection, filtering, sorting, and URL menu normalization to the view-model.

## Current Folder Shape

```txt
src/
  features/
    marketplace/
      model/
        marketplace.model.ts
      view-model/
        marketplace-board.vm.ts
  components/
    marketplace/
      MarketplaceBoard.tsx
      MarketplaceSidebar.tsx
  app/
    marketplace/
      page.tsx
```

## MVVM Responsibility Rules

### Model

Use model files for:

- Domain types
- UI state shapes
- API/data contracts
- Shared feature-specific type definitions

Do not put JSX or React hooks here.

### ViewModel

Use view-model files for:

- Filtering
- Sorting
- Derived state
- Route/query normalization
- Permission state mapping
- Display-ready data selection

View-model functions should stay mostly pure so they can be tested without rendering React.

### View

Use component files for:

- JSX
- Styling class names
- Event handlers
- Local UI state
- Calling view-model functions
- Translation at the display edge

Avoid adding business rules directly to views when the logic can live in a view-model.

## Important Compatibility Notes

- Stored marketplace enum values are still Korean strings, such as `개인판매`, `판매중`, and `전체`.
- Translations are display-only and should not replace stored values until a data migration exists.
- Marketplace filtering depends on these stable internal values, so labels should be translated only at the view edge.

## Verification

Completed checks:

- `npm.cmd run build`
- `npm.cmd run dev:restart`
- `http://localhost:3000/marketplace?menu=sell` returned `200`

## Next Refactor Targets

Recommended next steps:

- Move marketplace form submit/validation display mapping into a form view-model.
- Split `MarketplacePostForm.tsx`, which is currently large.
- Apply the same model/view-model pattern to notifications.
- Apply the same model/view-model pattern to my-page dashboards.
- Add unit tests for `marketplace-board.vm.ts` filtering and sorting.
