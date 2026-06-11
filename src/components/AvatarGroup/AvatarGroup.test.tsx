import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AvatarGroup } from './AvatarGroup';
import { Avatar } from '../Avatar';

describe('AvatarGroup', () => {
  it('renders all avatars when under max', () => {
    render(
      <AvatarGroup max={4}>
        <Avatar name="Ada Lovelace" />
        <Avatar name="Grace Hopper" />
      </AvatarGroup>,
    );
    expect(screen.getByText('AL')).toBeInTheDocument();
    expect(screen.getByText('GH')).toBeInTheDocument();
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });

  it('renders a +N overflow chip when over max', () => {
    render(
      <AvatarGroup max={2}>
        <Avatar name="A B" />
        <Avatar name="C D" />
        <Avatar name="E F" />
        <Avatar name="G H" />
      </AvatarGroup>,
    );
    // max=2 reserves one slot for overflow: shows 1 avatar + "+3".
    expect(screen.getByText('+3')).toBeInTheDocument();
    expect(screen.getByLabelText('3 more')).toBeInTheDocument();
  });

  it('uses total to compute the overflow count for server-truncated lists', () => {
    render(
      <AvatarGroup max={3} total={120}>
        <Avatar name="A B" />
        <Avatar name="C D" />
        <Avatar name="E F" />
      </AvatarGroup>,
    );
    // shows max-1 = 2 avatars, overflow = 120 - 2 = 118.
    expect(screen.getByText('+118')).toBeInTheDocument();
  });

  it('exposes a group role so members are conveyed as one collection', () => {
    render(
      <AvatarGroup>
        <Avatar name="A B" />
        <Avatar name="C D" />
      </AvatarGroup>,
    );
    expect(screen.getByRole('group')).toBeInTheDocument();
  });

  it('labels the group from the label prop', () => {
    render(
      <AvatarGroup label="Project collaborators">
        <Avatar name="A B" />
        <Avatar name="C D" />
      </AvatarGroup>,
    );
    expect(screen.getByRole('group', { name: 'Project collaborators' })).toBeInTheDocument();
  });

  it('lets a consumer override the default role and label via props', () => {
    render(
      <AvatarGroup role="list" aria-label="Team">
        <Avatar name="A B" />
      </AvatarGroup>,
    );
    expect(screen.getByRole('list', { name: 'Team' })).toBeInTheDocument();
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  it('propagates size to children and the overflow chip', () => {
    const { container } = render(
      <AvatarGroup max={1} size="lg">
        <Avatar name="A B" />
        <Avatar name="C D" />
      </AvatarGroup>,
    );
    const sized = container.querySelectorAll('[data-size="lg"]');
    // one rendered avatar + the overflow chip both reflect lg.
    expect(sized.length).toBe(2);
  });
});
