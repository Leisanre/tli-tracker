import { useEffect, useState } from 'react';

// Manual identifications for items the catalog doesn't recognize by id — loaded once,
// persisted in main process (userData), remembered forever after the user picks once.
export function useItemOverrides() {
  const [overrides, setOverrides] = useState({});

  useEffect(() => {
    window.tliApi.getOverrides().then(setOverrides);
  }, []);

  const identifyItem = async (rawItemId, catalogId) => {
    const updated = await window.tliApi.identifyItem(rawItemId, catalogId);
    setOverrides(updated);
  };

  return { overrides, identifyItem };
}
