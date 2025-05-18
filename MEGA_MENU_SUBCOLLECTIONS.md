# Hierarchical Mega Menu with Subcollections

This document explains the updated mega menu functionality with support for hierarchical structures like:

```
Fashion >> Adidas >> Products
```

## Database Structure

The updated `mega_menu_collections` table now includes the following fields:

- `id`: Primary key
- `collection_id`: References a collection in the `collections` table
- `position`: Order in which the menu item appears (at its level)
- `is_active`: Whether the menu item is visible in the frontend
- `parent_menu_item_id`: Self-referencing foreign key to establish hierarchy
- `display_subcollections`: Whether subcollections should be displayed
- `level`: The depth level in the menu hierarchy (0 = top level)
- `created_at`: Timestamp when the menu item was created
- `updated_at`: Timestamp when the menu item was last updated

## API Endpoints

The mega menu API has been enhanced to support hierarchical structures:

- `GET /api/megamenu` - Get the mega menu tree with hierarchical relationships
- `POST /api/megamenu` - Add a collection to the mega menu (can specify parent)
- `POST /api/megamenu/subcollection` - Add a subcollection to an existing menu item
- `PUT /api/megamenu/:id` - Update a mega menu item (position, visibility, parent, display options)
- `DELETE /api/megamenu/:id` - Remove a collection from the mega menu (including all its subcollections)
- `POST /api/megamenu/reorder` - Reorder the mega menu items

## Usage Examples

### Adding a Top-Level Menu Item

```javascript
// Adding "Fashion" as a top-level menu item
fetch('/api/megamenu', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    collection_id: 1, // ID of the "Fashion" collection
    position: 0,
    is_active: true,
    display_subcollections: true // Set to true if you want to show subcollections
  })
});
```

### Adding a Subcollection

```javascript
// Adding "Adidas" as a subcollection under "Fashion"
fetch('/api/megamenu/subcollection', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    collection_id: 5, // ID of the "Adidas" collection
    parent_menu_item_id: 1, // ID of the "Fashion" menu item
    position: 0,
    is_active: true
  })
});
```

### Retrieving the Menu

When you fetch the mega menu with `GET /api/megamenu`, the response will include:

```json
{
  "megaMenu": [
    {
      "id": 1,
      "collection_id": 1,
      "position": 0,
      "is_active": true,
      "parent_menu_item_id": null,
      "display_subcollections": true,
      "level": 0,
      "collection_name": "Fashion",
      "collection_slug": "fashion",
      "parent_id": null,
      "collection_type": "category_parent",
      "collection_level": 0,
      "children": [
        {
          "id": 2,
          "collection_id": 5,
          "position": 0,
          "is_active": true,
          "parent_menu_item_id": 1,
          "display_subcollections": false,
          "level": 1,
          "collection_name": "Adidas",
          "collection_slug": "adidas",
          "parent_id": 1,
          "collection_type": "brand",
          "collection_level": 1,
          "children": []
        }
      ]
    }
  ],
  "collectionsTree": [...] // The full collection hierarchy for admin selection
}
```

## Migration Scripts

Two migration scripts have been created:

1. `npm run mega-menu-migration` - Creates the initial mega_menu_collections table
2. `npm run mega-menu-subcollections` - Updates the table to support hierarchical relationships

## Frontend Integration

When integrating with the frontend, you should now:

1. Parse the hierarchical structure of the megaMenu array
2. Render top-level menu items (level = 0) as main navigation items
3. For each item with children, render a dropdown or nested menu
4. Only display children when the parent has display_subcollections = true

This approach allows flexibility in creating deep navigation structures with collections and subcollections. 