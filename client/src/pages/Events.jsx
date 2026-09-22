import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { eventsRequest } from '../api/client';
import { categories, sorts, titleCase, discoveryParams } from '../lib/events';
import EventCard from '../components/events/EventCard';
import { Skeleton, ErrorState, EmptyState, Pagination, Sheet } from '../components/ui';

function Filters({ params, apply }) {
  return <form className="filters stack" onSubmit={(e) => { e.preventDefault(); apply(Object.fromEntries(new FormData(e.currentTarget))); }}>
    <label className="field">Category<select name="category" defaultValue={params.category || ''}><option value="">All categories</option>{categories.map((c) => <option key={c} value={c}>{titleCase(c)}</option>)}</select></label>
    <label className="field">Club slug<input name="club" placeholder="e.g. coding-club" defaultValue={params.club || ''} /></label>
    <label className="field">Department<select name="department" defaultValue={params.department || ''}><option value="">All departments</option>{['all', 'CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'MBA', 'MCA', 'Other'].map((d) => <option key={d}>{d}</option>)}</select></label>
    <label className="field">Venue name<input name="venue" placeholder="Exact name or ID" defaultValue={params.venue || ''} /></label>
    <label className="field">From<input type="date" name="from" defaultValue={params.from?.slice(0, 10) || ''} /></label>
    <label className="field">Through<input type="date" name="to" defaultValue={params.to?.slice(0, 10) || ''} /></label>
    <button className="button" type="submit">Apply filters ↗</button>
  </form>;
}
export default function Events() {
  const [search, setSearch] = useSearchParams();
  const [open, setOpen] = useState(false);
  const params = discoveryParams(search);
  const query = useQuery({ queryKey: ['events', params], queryFn: ({ signal }) => eventsRequest(params, signal), placeholderData: keepPreviousData });
  function update(values) {
    const next = { ...params, page: '1', ...values };
    Object.keys(next).forEach((key) => { if (!next[key]) delete next[key]; });
    setSearch(next); setOpen(false);
  }
  const apply = (values) => update({ ...values, from: values.from ? new Date(`${values.from}T00:00:00`).toISOString() : '', to: values.to ? new Date(`${values.to}T23:59:59`).toISOString() : '' });
  return <div className="container page"><header className="page-heading"><p className="eyebrow">THE CAMPUS CALENDAR</p><h1>Find your <em>next thing.</em></h1><p>Big ideas. New people. A reason to step outside your routine.</p></header>
    <form className="search-bar" key={params.search || ''} onSubmit={(e) => { e.preventDefault(); update({ search: new FormData(e.currentTarget).get('search') }); }}><span aria-hidden="true">⌕</span><input aria-label="Search events" name="search" defaultValue={params.search || ''} placeholder="Search events, ideas, interests…" /><button className="button">Search ↗</button></form>
    <div className="discovery-layout"><aside className="desktop-filters"><div className="section-header"><h2>Refine</h2><button className="text-button" onClick={() => setSearch({})}>Clear all</button></div><Filters key={search.toString()} params={params} apply={apply} /></aside>
      <section aria-label="Event results" aria-busy={query.isFetching}><div className="results-bar"><span aria-live="polite">{query.data ? `${query.data.meta.total} events` : 'Finding events…'}</span><button className="button button-secondary mobile-filter" onClick={() => setOpen(true)}>Filters</button><label className="sr-only" htmlFor="sort">Sort events</label><select id="sort" value={params.sort || ''} onChange={(e) => update({ sort: e.target.value })}><option value="">{params.search ? 'Most relevant' : 'Soonest first'}</option>{Object.entries(sorts).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select><label className="sr-only" htmlFor="limit">Events per page</label><select id="limit" value={params.limit} onChange={(e) => update({ limit: e.target.value })}>{[12, 24, 50].map((n) => <option key={n} value={n}>{n} / page</option>)}</select></div>
        {Object.entries(params).some(([k, v]) => !['page', 'limit'].includes(k) && v) && <button className="filter-reset" onClick={() => setSearch({})}>Clear filters ×</button>}
        {query.isPending ? <Skeleton /> : query.isError ? <ErrorState error={query.error} retry={query.refetch} /> : query.data.data.length ? <><div className="event-grid">{query.data.data.map((event) => <EventCard event={event} key={event._id} />)}</div><Pagination meta={query.data.meta} onPage={(page) => update({ page: String(page) })} /></> : <EmptyState title="Nothing here. Yet."><p>Try a different date, a broader search, or start fresh.</p><button className="button button-secondary" onClick={() => setSearch({})}>Explore all events</button></EmptyState>}
      </section></div>
    <Sheet open={open} onClose={() => setOpen(false)} title="Refine your search"><Filters key={search.toString()} params={params} apply={apply} /><button className="text-button" onClick={() => { setSearch({}); setOpen(false); }}>Clear all filters</button></Sheet>
  </div>;
}
