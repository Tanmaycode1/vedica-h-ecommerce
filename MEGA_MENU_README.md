# Mega Menu Feature

This feature allows you to create a hierarchical mega menu for the e-commerce storefront by selecting collections to display in the menu.

## Backend Setup

1. Run the mega menu migration to create the necessary table:
   ```bash
   cd backend
   npm run mega-menu-migration
   ```

2. The migration creates a `mega_menu_collections` table that stores which collections should appear in the mega menu, their order, and visibility status.

3. The backend API has the following endpoints:
   - `GET /api/megamenu` - Get the mega menu tree and all available collections
   - `POST /api/megamenu` - Add a collection to the mega menu
   - `PUT /api/megamenu/:id` - Update a mega menu item (position, visibility)
   - `DELETE /api/megamenu/:id` - Remove a collection from the mega menu
   - `POST /api/megamenu/reorder` - Reorder the mega menu items

## Admin Panel

1. Navigate to the Mega Menu page in the admin panel sidebar.

2. The page is divided into two sections:
   - **Available Collections** - Shows a tree view of all collections in the system. You can expand/collapse parent collections to view their children.
   - **Mega Menu Structure** - Shows the collections currently in the mega menu. You can reorder them via drag and drop, hide/show them, or remove them.

3. To add a collection to the mega menu, find it in the Available Collections tree and click the "Add" button.

4. To reorder menu items, simply drag and drop them in the Mega Menu Structure section.

5. To hide a collection without removing it, click the eye icon to toggle visibility.

## Frontend Integration

The mega menu is ready to be integrated into the frontend template. The API endpoint `/api/megamenu` returns all the necessary data to build the menu:

```json
{
  "megaMenu": [
    {
      "id": 1,
      "collection_id": 5,
      "position": 0,
      "is_active": true,
      "collection_name": "Clothing",
      "collection_slug": "clothing",
      "parent_id": 2,
      "collection_type": "category",
      "level": 1
    },
    ...
  ]
}
```

Use this data to generate the mega menu in the template's header. 