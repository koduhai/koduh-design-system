import {
  AppBar,
  Sidebar,
  Breadcrumbs,
  Tabs,
  Pagination,
  Stepper,
  PageHeader,
  Button,
  Avatar,
} from '@koduhai/design-system';
import type { Seed } from './types';

// Reused demo data (verbatim from the corresponding *Demo.tsx files).
const sidebarItems = [
  { id: 'home', label: 'Home', href: '#home', active: true },
  { id: 'search', label: 'Search', href: '#search' },
  { id: 'profile', label: 'Profile', href: '#profile' },
  { id: 'disabled', label: 'Disabled', href: '#x', disabled: true },
];

const breadcrumbTrail = [
  { label: 'Home', href: '/' },
  { label: 'Library', href: '/library' },
  { label: 'Data', href: '/library/data' },
  { label: 'Current' },
];

const tabItems = [
  { id: 'overview', label: 'Overview', content: 'Overview content goes here.' },
  { id: 'specs', label: 'Specs', content: 'Specifications content goes here.' },
  { id: 'reviews', label: 'Reviews', content: 'Reviews content goes here.' },
];

const stepperSteps = [
  { label: 'Account', description: 'Create your credentials' },
  { label: 'Profile', description: 'Tell us about you' },
  { label: 'Billing', description: 'Add a payment method' },
  { label: 'Review', description: 'Confirm and finish' },
];

// Playground seeds for Navigation components. Add: Name: { Component, props?, children? }.
const seeds: Record<string, Seed> = {
  AppBar: {
    Component: AppBar,
    props: {
      title: 'Koduh AI',
      actions: (
        <>
          <Button variant="ghost" tone="neutral">
            Docs
          </Button>
          <Avatar name="Ada Lovelace" size="sm" />
        </>
      ),
    },
  },
  Sidebar: {
    Component: Sidebar,
    props: {
      items: sidebarItems,
      'aria-label': 'Primary',
      header: <strong>Koduh</strong>,
      footer: <small>v1.0</small>,
    },
  },
  Breadcrumbs: {
    Component: Breadcrumbs,
    props: {
      'aria-label': 'Breadcrumb',
      items: breadcrumbTrail,
    },
  },
  Tabs: {
    Component: Tabs,
    props: {
      items: tabItems,
      value: 'overview',
    },
  },
  Pagination: {
    Component: Pagination,
    props: {
      count: 20,
      page: 6,
      'aria-label': 'Pagination',
    },
  },
  Stepper: {
    Component: Stepper,
    props: {
      steps: stepperSteps,
      activeStep: 2,
      'aria-label': 'Onboarding progress',
    },
  },
  PageHeader: {
    Component: PageHeader,
    props: {
      title: 'Project Atlas',
      subtitle: 'Last updated 2 hours ago',
      breadcrumbs: [
        { label: 'Home', href: '#a' },
        { label: 'Projects', href: '#b' },
        { label: 'Project Atlas' },
      ],
      actions: (
        <>
          <Button variant="outline" tone="neutral">
            Settings
          </Button>
          <Button>New item</Button>
        </>
      ),
    },
  },
};

export default seeds;
