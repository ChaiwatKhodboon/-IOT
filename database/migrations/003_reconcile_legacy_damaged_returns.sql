WITH damaged AS (
  SELECT equipment_id, SUM(quantity)::integer AS quantity
  FROM loans
  WHERE status = 'returned'
    AND return_condition IN ('damaged','abnormal')
  GROUP BY equipment_id
)
UPDATE equipment AS e
SET maintenance_quantity = LEAST(d.quantity, e.total_quantity),
    available_quantity = GREATEST(0, e.available_quantity - d.quantity),
    status = 'maintenance',
    updated_at = NOW()
FROM damaged AS d
WHERE e.id = d.equipment_id
  AND e.status = 'maintenance'
  AND e.maintenance_quantity = 0;
