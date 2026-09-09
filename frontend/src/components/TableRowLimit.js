import { useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';

export const TABLE_ROW_LIMIT = 50;

/**
 * Keeps long tables readable while still allowing every record to be reached
 * without changing the API request.
 */
export function useTableRowLimit(rows) {
  const [showAll, setShowAll] = useState(false);
  const hasHiddenRows = rows.length > TABLE_ROW_LIMIT;

  useEffect(() => {
    if (!hasHiddenRows) {
      setShowAll(false);
    }
  }, [hasHiddenRows]);

  return {
    visibleRows: showAll ? rows : rows.slice(0, TABLE_ROW_LIMIT),
    rowLimitControl: hasHiddenRows ? (
      <Button
        className="mt-3"
        variant="outline-primary"
        size="sm"
        onClick={() => setShowAll((current) => !current)}
      >
        {showAll ? 'Show fewer' : `View all (${rows.length})`}
      </Button>
    ) : null,
  };
}
