-- A single read-only check after applying the order-read migrations.
SELECT
  (SELECT COUNT(*) FROM sqlite_schema WHERE type = 'index' AND name IN (
    'idx_order_items_order_id', 'idx_orders_status', 'idx_orders_user_created', 'idx_orders_created'
  )) AS expected_4_indexes,
  (SELECT COUNT(*) FROM sqlite_schema WHERE type = 'trigger' AND name IN (
    'refresh_order_list_after_orders_insert', 'refresh_order_list_after_orders_update',
    'refresh_order_list_after_orders_delete', 'refresh_order_list_after_order_items_insert',
    'refresh_order_list_after_order_items_update', 'refresh_order_list_after_order_items_delete',
    'refresh_order_list_after_products_insert', 'refresh_order_list_after_products_update',
    'refresh_order_list_after_products_delete', 'count_pending_order_insert',
    'count_pending_order_delete', 'count_pending_order_status_change'
  )) AS expected_12_triggers,
  EXISTS (SELECT 1 FROM order_list_revision WHERE id = 1 AND length(version) = 32) AS revision_ok,
  EXISTS (SELECT 1 FROM pending_order_count
          WHERE id = 1 AND pending_count = (SELECT COUNT(*) FROM orders WHERE status = 'pending')) AS pending_count_ok;
