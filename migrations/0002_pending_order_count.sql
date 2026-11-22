-- Seed from existing orders. D1 applies the migration in a transaction.
CREATE TABLE IF NOT EXISTS pending_order_count (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  pending_count INTEGER NOT NULL CHECK (pending_count >= 0)
);

INSERT OR REPLACE INTO pending_order_count (id, pending_count)
SELECT 1, COUNT(*) FROM orders WHERE status = 'pending';

CREATE TRIGGER IF NOT EXISTS count_pending_order_insert
AFTER INSERT ON orders WHEN NEW.status = 'pending' BEGIN
  UPDATE pending_order_count SET pending_count = pending_count + 1 WHERE id = 1;
END;

CREATE TRIGGER IF NOT EXISTS count_pending_order_delete
AFTER DELETE ON orders WHEN OLD.status = 'pending' BEGIN
  UPDATE pending_order_count SET pending_count = pending_count - 1 WHERE id = 1;
END;

CREATE TRIGGER IF NOT EXISTS count_pending_order_status_change
AFTER UPDATE OF status ON orders WHEN (NEW.status = 'pending') <> (OLD.status = 'pending') BEGIN
  UPDATE pending_order_count SET pending_count = pending_count + (NEW.status = 'pending')
    - (OLD.status = 'pending') WHERE id = 1;
END;
