import {
  Avatar,
  AvatarGroup,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chart,
  CountUp,
  DataTable,
  DescriptionList,
  NotificationBadge,
  Sparkline,
  Table,
  Timeline,
  Tree,
} from '@koduhai/design-system';
import type { Column, DataColumn, TimelineItem, TreeNode } from '@koduhai/design-system';
import type { Seed } from './types';

// --- Shared data, copied from the component demos ---

interface User {
  id: string;
  name: string;
  role: string;
  status: string;
}

const tableUsers: User[] = [
  { id: 'u1', name: 'Ada Lovelace', role: 'Engineer', status: 'Active' },
  { id: 'u2', name: 'Linus Torvalds', role: 'Maintainer', status: 'Active' },
  { id: 'u3', name: 'Grace Hopper', role: 'Admiral', status: 'Inactive' },
];

const tableColumns: Column<User>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'role', header: 'Role', sortable: true },
  { key: 'status', header: 'Status', align: 'end' },
];

interface Person {
  id: string;
  name: string;
  role: string;
  age: number;
  joined: string;
}

const dataTablePeople: Person[] = Array.from({ length: 6 }, (_, i) => ({
  id: String(i + 1),
  name: ['Ann', 'Bob', 'Cy', 'Dee', 'Eli'][i % 5] + ` ${i + 1}`,
  role: i % 2 ? 'admin' : 'user',
  age: 22 + (i % 20),
  joined: `20${20 + (i % 5)}-0${(i % 9) + 1}-1${i % 9}`,
}));

const dataTableColumns: DataColumn<Person>[] = [
  { key: 'name', header: 'Name', sortable: true, filter: 'text' },
  { key: 'role', header: 'Role', sortable: true, filter: 'select' },
  {
    key: 'age',
    header: 'Age',
    type: 'number',
    align: 'end',
    sortable: true,
    filter: 'number-range',
  },
  { key: 'joined', header: 'Joined', type: 'date', sortable: true, filter: 'date-range' },
];

const descriptionItems = [
  { term: 'Status', description: 'Active' },
  { term: 'Region', description: 'us-east-1' },
  { term: 'Plan', description: 'Enterprise' },
  { term: 'Owner', description: 'koduhai@koduhai.com' },
];

const treeNodes: TreeNode[] = [
  {
    id: 'src',
    label: 'src',
    children: [
      {
        id: 'components',
        label: 'components',
        children: [
          { id: 'button', label: 'Button.tsx' },
          { id: 'tree', label: 'Tree.tsx' },
        ],
      },
      { id: 'index', label: 'index.ts' },
    ],
  },
  {
    id: 'docs',
    label: 'docs',
    children: [{ id: 'readme', label: 'README.md' }],
  },
  { id: 'package', label: 'package.json' },
];

const timelineItems: TimelineItem[] = [
  {
    id: '1',
    title: 'Deployment succeeded',
    time: '2 min ago',
    content: 'v2.4.0 rolled out to production across all regions.',
  },
  {
    id: '2',
    title: 'Build passed',
    time: '8 min ago',
    content: 'All checks green: unit, types, a11y.',
  },
  { id: '3', title: 'Pull request merged', time: '12 min ago' },
  { id: '4', title: 'Review approved', time: '1 hr ago', icon: '✓' },
];

const sparklineData = [4, 8, 6, 12, 9, 14, 11, 18, 16, 22];
const chartCategories = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

// Playground seeds for Data-display components. Add: Name: { Component, props?, children? }.
const seeds: Record<string, Seed> = {
  AvatarGroup: {
    Component: AvatarGroup,
    props: {
      size: 'md',
      max: 3,
      label: 'Team',
      children: (
        <>
          <Avatar name="Ada Lovelace" />
          <Avatar name="Grace Hopper" />
          <Avatar name="Alan Turing" />
          <Avatar name="Linus Torvalds" />
        </>
      ),
    },
  },
  NotificationBadge: {
    Component: NotificationBadge,
    props: {
      count: 3,
      label: '3 unread notifications',
      children: (
        <Button variant="outline" tone="neutral">
          Inbox
        </Button>
      ),
    },
  },
  Card: {
    Component: Card,
    props: {
      variant: 'elevated',
      padding: 'none',
      style: { maxWidth: 360, width: '100%' },
      children: (
        <>
          <CardHeader>
            <strong>Card title</strong>
          </CardHeader>
          <CardBody>
            Body content sits in the padded region between the header and footer dividers.
          </CardBody>
          <CardFooter
            style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--ku-space-2)' }}
          >
            <Button variant="ghost" tone="neutral" size="sm">
              Cancel
            </Button>
            <Button size="sm">Save</Button>
          </CardFooter>
        </>
      ),
    },
  },
  CountUp: {
    Component: CountUp,
    props: { value: 1280 },
  },
  Sparkline: {
    Component: Sparkline,
    props: { data: sparklineData, type: 'area', 'aria-label': 'Area sparkline' },
  },
  Chart: {
    Component: Chart,
    props: {
      type: 'line',
      categories: chartCategories,
      series: [
        { name: 'Signups', data: [12, 19, 14, 23, 21] },
        { name: 'Active', data: [8, 11, 9, 15, 18] },
        { name: 'Churn', data: [3, 2, 4, 2, 1] },
      ],
      'aria-label': 'Signups, active, and churn over the week',
    },
  },
  Table: {
    Component: Table,
    props: {
      columns: tableColumns,
      data: tableUsers,
      getRowId: (u: User) => u.id,
      caption: 'Team members',
      captionVisible: true,
    },
  },
  DataTable: {
    Component: DataTable,
    props: {
      columns: dataTableColumns,
      data: dataTablePeople,
      getRowId: (r: Person) => r.id,
      caption: 'Team members',
      captionVisible: true,
    },
  },
  DescriptionList: {
    Component: DescriptionList,
    props: { items: descriptionItems },
  },
  Tree: {
    Component: Tree,
    props: { nodes: treeNodes, defaultExpanded: ['src', 'components'] },
  },
  Timeline: {
    Component: Timeline,
    props: { items: timelineItems, 'aria-label': 'Activity history' },
  },
};

export default seeds;
