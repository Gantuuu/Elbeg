CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

-- One generation covers all tables represented in the administrator order list.
CREATE TABLE IF NOT EXISTS order_list_revision (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  version TEXT NOT NULL
);
INSERT OR IGNORE INTO order_list_revision VALUES (1, hex(randomblob(16)));

CREATE TRIGGER IF NOT EXISTS refresh_order_list_after_orders_insert
AFTER insert ON orders BEGIN
  UPDATE order_list_revision SET version = hex(randomblob(16)) WHERE id = 1;
END;

CREATE TRIGGER IF NOT EXISTS refresh_order_list_after_orders_update
AFTER update ON orders BEGIN
  UPDATE order_list_revision SET version = hex(randomblob(16)) WHERE id = 1;
END;

CREATE TRIGGER IF NOT EXISTS refresh_order_list_after_orders_delete
AFTER delete ON orders BEGIN
  UPDATE order_list_revision SET version = hex(randomblob(16)) WHERE id = 1;
END;

CREATE TRIGGER IF NOT EXISTS refresh_order_list_after_order_items_insert
AFTER insert ON order_items BEGIN
  UPDATE order_list_revision SET version = hex(randomblob(16)) WHERE id = 1;
END;

CREATE TRIGGER IF NOT EXISTS refresh_order_list_after_order_items_update
AFTER update ON order_items BEGIN
  UPDATE order_list_revision SET version = hex(randomblob(16)) WHERE id = 1;
END;

CREATE TRIGGER IF NOT EXISTS refresh_order_list_after_order_items_delete
AFTER delete ON order_items BEGIN
  UPDATE order_list_revision SET version = hex(randomblob(16)) WHERE id = 1;
END;

CREATE TRIGGER IF NOT EXISTS refresh_order_list_after_products_insert
AFTER insert ON products BEGIN
  UPDATE order_list_revision SET version = hex(randomblob(16)) WHERE id = 1;
END;

CREATE TRIGGER IF NOT EXISTS refresh_order_list_after_products_update
AFTER update ON products BEGIN
  UPDATE order_list_revision SET version = hex(randomblob(16)) WHERE id = 1;
END;

CREATE TRIGGER IF NOT EXISTS refresh_order_list_after_products_delete
AFTER delete ON products BEGIN
  UPDATE order_list_revision SET version = hex(randomblob(16)) WHERE id = 1;
END;
