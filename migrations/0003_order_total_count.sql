-- D1 applies these statements together. Seed existing orders at the same point
-- in time as the triggers that maintain the count for future inserts and deletes.
CREATE TABLE IF NOT EXISTS order_total_count (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  total_count INTEGER NOT NULL CHECK (total_count >= 0)
);

INSERT OR REPLACE INTO order_total_count (id, total_count)
SELECT 1, COUNT(*) FROM orders;

CREATE TRIGGER IF NOT EXISTS count_order_total_insert
AFTER INSERT ON orders BEGIN
  UPDATE order_total_count SET total_count = total_count + 1 WHERE id = 1;
END;

CREATE TRIGGER IF NOT EXISTS count_order_total_delete
AFTER DELETE ON orders BEGIN
  UPDATE order_total_count SET total_count = total_count - 1 WHERE id = 1;
END;
