'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function SearchBar({ defaultValue = '' }: { defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue);
  const [executive, setExecutive] = useState(false);
  const router = useRouter();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    router.push(`/company/${encodeURIComponent(value.trim())}${executive ? '?executive=true' : ''}`);
  };

  return (
    <form onSubmit={onSubmit}>
      <div className="search-row">
        <input
          className="input"
          placeholder="Enter a company name (e.g. Shopify, Acme)"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button className="button" type="submit">Analyze</button>
      </div>
      <label className="toggle" style={{ marginTop: 10 }}>
        <input
          type="checkbox"
          checked={executive}
          onChange={(e) => setExecutive(e.target.checked)}
        />
        <span>Executive Mode — boardroom-ready output</span>
      </label>
    </form>
  );
}
