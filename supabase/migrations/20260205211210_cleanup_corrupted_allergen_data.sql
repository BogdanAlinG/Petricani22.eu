/*
  # Clean up corrupted allergen_info data

  1. Data Fixes
    - Removes HTML fragments and CSS properties from the `allergen_info` text array
      on 8 affected product rows
    - Filters out array elements containing '<', 'style', 'font-size', or '</strong>'
    - Preserves legitimate allergen entries (e.g., "gluten", "lapte", "ouă")

  2. Root Cause
    - The `extractAllergens` function was matching against raw HTML instead of
      stripped text, capturing CSS and tag fragments as allergen names
    - This has been fixed in the updated sync-foodnation edge function (stripHtml
      is now called before allergen regex matching)

  3. Affected Products (8 rows)
    - Products with allergen_info entries like "font-size: 12px",
      "xxl - 1300 g</p>...", "</strong> ouă", etc.
*/

UPDATE products
SET allergen_info = (
  SELECT COALESCE(
    array_agg(elem),
    '{}'::text[]
  )
  FROM unnest(allergen_info) AS elem
  WHERE elem NOT LIKE '%<%'
    AND elem NOT LIKE '%style%'
    AND elem NOT LIKE '%font-size%'
    AND elem NOT LIKE '%font-weight%'
    AND elem NOT LIKE '%</strong>%'
)
WHERE EXISTS (
  SELECT 1
  FROM unnest(allergen_info) AS a
  WHERE a LIKE '%<%'
    OR a LIKE '%style%'
    OR a LIKE '%font-size%'
    OR a LIKE '%font-weight%'
    OR a LIKE '%</strong>%'
);
