import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PostCard } from './PostCard';
import { deletePost } from '../api';
import type { Comment, Post } from '../types';

let comments: Comment[] = [];
vi.mock('../hooks', () => ({
  useComments: (_postId: string, enabled: boolean) => ({
    data: enabled ? comments : [],
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
}));
vi.mock('../api', () => ({
  deletePost: vi.fn(),
  deleteComment: vi.fn(),
  createComment: vi.fn(),
  report: vi.fn(),
}));
const deletePostMock = vi.mocked(deletePost);

const post = (over: Partial<Post> = {}): Post => ({
  id: 'post1',
  author_id: 'author',
  content: 'Bonjour à tous',
  hidden: false,
  created_at: new Date().toISOString(),
  author: { pseudonym: 'Jasmin' },
  community_comments: [{ count: 1 }],
  ...over,
});

describe('<PostCard />', () => {
  beforeEach(() => {
    deletePostMock.mockReset();
    comments = [
      {
        id: 'c1',
        post_id: 'post1',
        author_id: 'other',
        content: 'Merci pour le partage',
        hidden: false,
        created_at: new Date().toISOString(),
        author: { pseudonym: 'Olivier' },
      },
    ];
  });

  it('le bouton de commentaires bascule leur affichage', async () => {
    render(<PostCard post={post()} currentUserId="me" canWrite onChanged={vi.fn()} />);
    const toggle = screen.getByRole('button', { name: 'Commentaires (1)' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Merci pour le partage')).not.toBeInTheDocument();

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Merci pour le partage')).toBeInTheDocument();

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Merci pour le partage')).not.toBeInTheDocument();
  });

  it("« Signaler » sur la publication d'autrui ouvre le formulaire de signalement", async () => {
    render(<PostCard post={post()} currentUserId="me" canWrite onChanged={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Supprimer' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Signaler' }));
    expect(screen.getByRole('group', { name: 'Pourquoi signalez-vous ce message ?' })).toBeInTheDocument();
  });

  it('« Supprimer » ouvre la confirmation : annuler ne supprime rien', async () => {
    const onChanged = vi.fn();
    render(<PostCard post={post({ author_id: 'me' })} currentUserId="me" canWrite onChanged={onChanged} />);
    expect(screen.queryByRole('button', { name: 'Signaler' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
    const dialog = screen.getByRole('alertdialog', { name: 'Supprimer le message' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Annuler' }));
    expect(deletePostMock).not.toHaveBeenCalled();
    expect(onChanged).not.toHaveBeenCalled();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('« Supprimer » puis confirmer supprime la publication et rafraîchit la liste', async () => {
    deletePostMock.mockResolvedValueOnce();
    const onChanged = vi.fn();
    render(<PostCard post={post({ author_id: 'me' })} currentUserId="me" canWrite onChanged={onChanged} />);
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
    const dialog = screen.getByRole('alertdialog', { name: 'Supprimer le message' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Supprimer' }));
    expect(deletePostMock).toHaveBeenCalledWith('post1');
    expect(onChanged).toHaveBeenCalledTimes(1);
  });

  it('une publication masquée affiche le badge à son auteure, pas aux autres', () => {
    const { unmount } = render(
      <PostCard
        post={post({ author_id: 'me', hidden: true })}
        currentUserId="me"
        canWrite
        onChanged={vi.fn()}
      />,
    );
    expect(screen.getByText('Masqué après signalements')).toBeInTheDocument();
    unmount();
    render(<PostCard post={post({ hidden: true })} currentUserId="me" canWrite onChanged={vi.fn()} />);
    expect(screen.queryByText('Masqué après signalements')).not.toBeInTheDocument();
  });
});
