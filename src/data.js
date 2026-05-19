export const OUTCOME_CONFIG = {
  preapproval: {
    label: 'Preapproval — Never Closed',
    badge: 'badge-fire',
    dot: 'bg-rust-400',
    priority: 'fire',
    description: 'Got approved, never bought',
  },
  denied: {
    label: 'Denied',
    badge: 'badge-warm',
    dot: 'bg-gold-400',
    priority: 'warm',
    description: 'Was denied — situation may have changed',
  },
  incomplete: {
    label: 'Incomplete Application',
    badge: 'badge-warm',
    dot: 'bg-gold-400',
    priority: 'warm',
    description: 'Never finished applying',
  },
  closed: {
    label: 'Closed',
    badge: 'badge-archive',
    dot: 'bg-forest-400',
    priority: 'archive',
    description: 'Successfully funded',
  },
  unknown: {
    label: 'Unknown',
    badge: 'badge-unknown',
    dot: 'bg-cream-200',
    priority: 'unknown',
    description: 'Needs manual review',
  },
}
