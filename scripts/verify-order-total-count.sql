SELECT
  (SELECT COUNT(*) FROM sqlite_schema WHERE type = 'trigger' AND name IN (
    'count_order_total_insert', 'count_order_total_delete'
  )) AS expected_2_triggers,
  EXISTS (SELECT 1 FROM order_total_count
          WHERE id = 1 AND total_count = (SELECT COUNT(*) FROM orders)) AS total_count_ok;
