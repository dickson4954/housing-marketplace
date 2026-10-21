import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Heart, MessageCircle, Eye, Video } from 'lucide-react-native';

import {
  addPropertyComment,
  getEngagementSummary,
  getPropertyComments,
  togglePropertyLike,
  type EngagementSummary,
  type PropertyComment,
} from '@/lib/customerEngagement';

const C = {
  card: '#14191B',
  cardSoft: '#181E20',
  lime: '#D7FF5F',
  white: '#FFFFFF',
  muted: '#9CA5A7',
  border: '#252C2E',
  rose: '#FF6B81',
};

export default function PropertyEngagement({
  propertyId,
  compact = false,
}: {
  propertyId: string;
  compact?: boolean;
}) {
  const [summary, setSummary] = useState<EngagementSummary | null>(null);
  const [comments, setComments] = useState<PropertyComment[]>([]);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  const refreshSummary = useCallback(async () => {
    try {
      const next = await getEngagementSummary(propertyId);
      setSummary(next);
      setError('');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to load engagement.',
      );
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const next = await getEngagementSummary(propertyId);
        if (!cancelled) {
          setSummary(next);
          setError('');
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Unable to load engagement.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  const onLike = async () => {
    if (!summary || busy) return;

    setBusy(true);
    setError('');

    try {
      const result = await togglePropertyLike(
        propertyId,
        summary.isLiked,
      );

      if (result) {
        setSummary((current) =>
          current
            ? {
                ...current,
                isLiked: result.isLiked,
                likeCount: result.likeCount,
              }
            : current,
        );
      } else {
        await refreshSummary();
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to update your like.',
      );
    } finally {
      setBusy(false);
    }
  };

  const onToggleComments = async () => {
    const nextOpen = !commentsOpen;
    setCommentsOpen(nextOpen);
    setError('');

    if (!nextOpen) return;

    try {
      const result = await getPropertyComments(propertyId);
      setComments(result);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to load comments.',
      );
    }
  };

  const onSubmitComment = async () => {
    const body = draft.trim();

    if (!body || body.length > 1000 || posting) return;

    setPosting(true);
    setError('');

    try {
      const created = await addPropertyComment(propertyId, body);
      setComments((current) => [created, ...current]);
      setDraft('');
      await refreshSummary();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to post your comment.',
      );
    } finally {
      setPosting(false);
    }
  };

  const personName = (comment: PropertyComment) => {
    const first = comment.user?.firstName?.trim() ?? '';
    const last = comment.user?.lastName?.trim() ?? '';
    return `${first} ${last}`.trim() || 'MAKAZII customer';
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="small" color={C.lime} />
      </View>
    );
  }

  if (!summary) {
    return error ? (
      <Text style={styles.errorText}>{error}</Text>
    ) : null;
  }

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      <View style={styles.metrics}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={summary.isLiked ? 'Unlike property' : 'Like property'}
          disabled={busy}
          onPress={(event) => {
            event.stopPropagation();
            void onLike();
          }}
          style={styles.metricButton}
        >
          <Heart
            size={compact ? 15 : 17}
            color={summary.isLiked ? C.lime : C.white}
            fill={summary.isLiked ? C.lime : 'transparent'}
          />
          <Text style={[styles.metricText, summary.isLiked && styles.likedText]}>
            {summary.likeCount}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View comments"
          onPress={(event) => {
            event.stopPropagation();
            void onToggleComments();
          }}
          style={styles.metricButton}
        >
          <MessageCircle size={compact ? 15 : 17} color={C.white} />
          <Text style={styles.metricText}>{summary.commentCount}</Text>
        </Pressable>

        <View style={styles.metricButton}>
          <Eye size={compact ? 15 : 17} color={C.muted} />
          <Text style={styles.metricText}>{summary.propertyViewCount}</Text>
        </View>

        {!compact ? (
          <View style={styles.metricButton}>
            <Video size={17} color={C.muted} />
            <Text style={styles.metricText}>{summary.videoViewCount}</Text>
          </View>
        ) : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {commentsOpen ? (
        <View style={styles.commentsPanel}>
          <Text style={styles.commentsTitle}>COMMENTS</Text>

          <View style={styles.composer}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Share your thoughts…"
              placeholderTextColor={C.muted}
              multiline
              maxLength={1000}
              style={styles.input}
              accessibilityLabel="Write a property comment"
            />
            <Pressable
              accessibilityRole="button"
              disabled={!draft.trim() || posting}
              onPress={(event) => {
                event.stopPropagation();
                void onSubmitComment();
              }}
              style={[
                styles.postButton,
                (!draft.trim() || posting) && styles.disabledButton,
              ]}
            >
              {posting ? (
                <ActivityIndicator size="small" color="#101415" />
              ) : (
                <Text style={styles.postButtonText}>Post</Text>
              )}
            </Pressable>
          </View>

          {comments.length === 0 ? (
            <Text style={styles.emptyComments}>
              No comments yet. Be the first to comment.
            </Text>
          ) : (
            comments.map((comment) => (
              <View key={comment.id} style={styles.comment}>
                <Text style={styles.commentAuthor}>{personName(comment)}</Text>
                <Text style={styles.commentBody}>{comment.body}</Text>
                <Text style={styles.commentDate}>
                  {Number.isNaN(Date.parse(comment.createdAt))
                    ? ''
                    : new Date(comment.createdAt).toLocaleDateString()}
                </Text>
              </View>
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  compactContainer: {
    marginTop: 10,
    paddingTop: 9,
  },
  metrics: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 17,
  },
  metricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 27,
  },
  metricText: {
    color: C.muted,
    fontSize: 11,
    fontWeight: '800',
  },
  likedText: {
    color: C.lime,
  },
  loading: {
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  errorText: {
    color: C.rose,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 7,
  },
  commentsPanel: {
    marginTop: 12,
    padding: 11,
    borderRadius: 13,
    backgroundColor: C.cardSoft,
    borderWidth: 1,
    borderColor: C.border,
  },
  commentsTitle: {
    color: C.lime,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.3,
    marginBottom: 10,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 110,
    color: C.white,
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#0B0F10',
    borderWidth: 1,
    borderColor: C.border,
  },
  postButton: {
    minHeight: 40,
    minWidth: 47,
    borderRadius: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.lime,
  },
  postButtonText: {
    color: '#101415',
    fontSize: 12,
    fontWeight: '900',
  },
  disabledButton: {
    opacity: 0.5,
  },
  emptyComments: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
  },
  comment: {
    paddingTop: 10,
    marginTop: 9,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  commentAuthor: {
    color: C.white,
    fontSize: 12,
    fontWeight: '800',
  },
  commentBody: {
    color: '#D5DADB',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  commentDate: {
    color: C.muted,
    fontSize: 10,
    marginTop: 5,
  },
});
