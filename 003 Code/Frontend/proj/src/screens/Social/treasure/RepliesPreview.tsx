// src/screens/Social/components/RepliesPreview.tsx
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useChildComments} from '../../../hooks/useComments';
import {getLocalProfileImage} from '../../../characters/profileImages';

type Props = {
  postId: number;
  parentId: number;
  previewCount: number;
  registerAddReply: (fn: (comment: string) => Promise<void>) => void;
  canDelete: (userId?: number) => boolean;
  onDeleted?: () => void; // ✅ 성공 후 상위에 알림만
  onReply: (parentId: number) => void;
  heartColWidth?: number;
  indent?: number;
};

const DEFAULT_HEART_W = 40;
const DEFAULT_INDENT = 12;
const REPLY_AVATAR = 32;

const RepliesPreview: React.FC<Props> = ({
  postId,
  parentId,
  previewCount,
  registerAddReply,
  canDelete,
  onDeleted,
  onReply,
  heartColWidth = DEFAULT_HEART_W,
  indent = DEFAULT_INDENT,
}) => {
  const {items, hasNext, loadMore, addReply, deleteComment} = useChildComments(
    postId,
    parentId,
  );

  useEffect(() => {
    registerAddReply(addReply);
  }, [addReply, registerAddReply]);

  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, previewCount);

  const handleDeleteChild = async (commentId: number) => {
    try {
      await deleteComment(commentId); // API + 로컬 제거(훅 내부)
      onDeleted?.(); // 부모 메타 갱신용 알림 (API 호출 없음)
    } catch (e: any) {
      Alert.alert('삭제 실패', e?.message ?? '댓글 삭제에 실패했어요.');
    }
  };

  return (
    <View style={[styles.replyBlock, {paddingLeft: indent}]}>
      {visible.map(child => (
        <View key={child.treasureHuntPostCommentId} style={styles.row}>
          <View style={styles.leftCol}>
            {child.profileImageUrl ? (
              <Image
                source={getLocalProfileImage(child.profileImageUrl)}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder} />
            )}
          </View>

          <View style={styles.centerCol}>
            <View style={styles.headerLine}>
              <Text style={styles.userName} numberOfLines={1}>
                {child.userName}
              </Text>
              <Text style={styles.dateText}>
                {new Date(child.createdAt).toLocaleString()}
              </Text>
            </View>

            <Text style={styles.bodyText}>{child.comment}</Text>

            <View style={styles.actions}>
              <TouchableOpacity onPress={() => onReply(parentId)}>
                <Text style={styles.actionText}>답장</Text>
              </TouchableOpacity>

              {canDelete(child.appUserId) && (
                <TouchableOpacity
                  onPress={() =>
                    handleDeleteChild(child.treasureHuntPostCommentId as number)
                  }>
                  <Text style={styles.actionText}>삭제</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={[styles.rightCol, {width: heartColWidth}]}>
            <Icon name="heart-outline" size={18} color={'#E06167'} />
            <Text style={styles.likeLabel}>{child.likeCount}</Text>
          </View>
        </View>
      ))}

      {/* {(hasNext || items.length > previewCount) && (
        <TouchableOpacity
          onPress={() => {
            if (!expanded && hasNext) loadMore();
            setExpanded(prev => !prev);
          }}
          style={{marginTop: 6, paddingLeft: indent}}>
          <Text style={{fontSize: 12, color: '#61402D'}}>
            {expanded ? '대댓글 접기' : '댓글 더보기'}
          </Text>
        </TouchableOpacity>
      )} */}
    </View>
  );
};

export default RepliesPreview;

const styles = StyleSheet.create({
  replyBlock: {marginTop: 6, width: '100%'},
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    marginTop: 10,
  },
  leftCol: {width: REPLY_AVATAR + 8, alignItems: 'flex-start'},
  avatar: {
    width: REPLY_AVATAR,
    height: REPLY_AVATAR,
    borderRadius: REPLY_AVATAR / 2,
    backgroundColor: '#ddd',
  },
  avatarPlaceholder: {
    width: REPLY_AVATAR,
    height: REPLY_AVATAR,
    borderRadius: REPLY_AVATAR / 2,
    backgroundColor: '#ddd',
  },
  centerCol: {flex: 1, paddingRight: 12},
  headerLine: {flexDirection: 'row', alignItems: 'baseline', gap: 8},
  userName: {
    fontWeight: '600',
    fontSize: 12,
    color: '#242424',
    maxWidth: '70%',
  },
  dateText: {fontSize: 10, color: '#999'},
  bodyText: {fontSize: 13, color: '#242424', marginTop: 2},
  actions: {flexDirection: 'row', gap: 12, marginTop: 6},
  actionText: {fontSize: 12, color: '#888'},
  rightCol: {alignItems: 'center', paddingTop: 6},
  likeLabel: {fontSize: 10, color: '#222', marginTop: 2},
});
