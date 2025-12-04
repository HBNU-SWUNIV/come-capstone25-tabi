// src/screens/Social/treasure/CommentModal.tsx
import React, {forwardRef, useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  Dimensions,
  Image,
  Keyboard,
  Animated,
} from 'react-native';
import {Modalize} from 'react-native-modalize';
import Icon from 'react-native-vector-icons/Ionicons';
import {useParentComments} from '../../../hooks/useComments';
import {getLocalProfileImage} from '../../../characters/profileImages';
import RepliesPreview from './RepliesPreview';
import HanbatLogo from '../../../img/hanbat_logo.png';

interface SelectedItem {
  id?: number;
  treasureHuntPostId?: number;
  author?: string;
  title?: string;
  description?: string;
  avatar?: any;
}

interface CommentModalProps {
  selectedItem: SelectedItem | null;
  currentUserId?: number;
  onClose?: () => void;
}

const SCREEN_H = Dimensions.get('window').height;
const H60 = Math.round(SCREEN_H * 0.6);
const H90 = Math.round(SCREEN_H * 0.86);

// 부모 댓글 레이아웃 기준값
const AVATAR_W = 32;
const AVATAR_GAP = 10;
const LEFT_PADDING = 10;
const LEFT_SPACER = 30;
const HEART_COL_W = 40;

const CommentModal = forwardRef<Modalize, CommentModalProps>(
  ({selectedItem, currentUserId, onClose}, ref) => {
    if (!selectedItem) return null;

    const postId =
      selectedItem.treasureHuntPostId ??
      selectedItem.id ??
      (() => {
        throw new Error('selectedItem에 게시글 ID가 없습니다.');
      })();

    const {
      items: parents,
      loading,
      refreshing,
      hasNext,
      refresh,
      loadMore,
      addComment,
      deleteComment: deleteParentComment,
      onChildDeletedMeta, // ✅ 대댓글 삭제 메타 반영
    } = useParentComments(postId);

    const [text, setText] = useState('');
    const [replyParentId, setReplyParentId] = useState<number | null>(null);
    const inputRef = useRef<TextInput>(null);

    // 부모 → 자식으로 전달할 '답글 추가' 함수 저장 맵
    const addReplyMap = useRef<
      Record<number, (comment: string) => Promise<void>>
    >({});

    const handleReplyPress = (parentId: number) => {
      setReplyParentId(parentId);
      requestAnimationFrame(() => inputRef.current?.focus());
    };

    // 부모 댓글 삭제 (API 호출 단 한 번)
    const handleDeleteParent = async (commentId: number) => {
      try {
        await deleteParentComment(commentId);
      } catch (e: any) {
        Alert.alert('삭제 실패', e?.message ?? '댓글 삭제에 실패했어요.');
      }
    };

    // 대댓글 삭제 후 부모 메타(예: childrenCount)만 갱신
    const handleChildDeleted = (parentId: number) => {
      onChildDeletedMeta(parentId);
    };

    // "내 댓글인지" 판별: 오직 댓글 작성자와 현재 로그인한 사용자가 같을 때만
    const isMine = (appUserId?: number) =>
      !!currentUserId && !!appUserId && currentUserId === appUserId;

    const handleSend = async () => {
      const trimmed = text.trim();
      if (!trimmed) return;
      try {
        if (replyParentId) {
          const fn = addReplyMap.current[replyParentId];
          if (fn) await fn(trimmed);
        } else {
          await addComment(trimmed);
        }
        setText('');
        setReplyParentId(null);
      } catch (e: any) {
        Alert.alert('전송 실패', e?.message ?? '댓글 등록에 실패했어요.');
      }
    };

    // 모달 높이 & 키보드
    const [modalH, setModalH] = useState<number>(H60);
    const [floatingH, setFloatingH] = useState(72);
    const kbAnim = useRef(new Animated.Value(0)).current;
    const [keyboardVisible, setKeyboardVisible] = useState(false);

    useEffect(() => {
      const showEvt =
        Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
      const hideEvt =
        Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

      const onShow = (e: any) => {
        const h = e?.endCoordinates?.height ?? 0;
        setKeyboardVisible(true);
        Animated.timing(kbAnim, {
          toValue: h,
          duration: Platform.OS === 'ios' ? e?.duration ?? 200 : 200,
          useNativeDriver: true,
        }).start();
      };
      const onHide = (e: any) => {
        setKeyboardVisible(false);
        Animated.timing(kbAnim, {
          toValue: 0,
          duration: Platform.OS === 'ios' ? e?.duration ?? 200 : 150,
          useNativeDriver: true,
        }).start();
      };
      const subShow = Keyboard.addListener(showEvt, onShow);
      const subHide = Keyboard.addListener(hideEvt, onHide);
      return () => {
        subShow.remove();
        subHide.remove();
      };
    }, [kbAnim]);

    const Header = (
      <View style={styles.stickyHeader}>
        <View style={styles.postHeader}>
          {!!selectedItem.avatar ? (
            <Image source={selectedItem.avatar} style={styles.headerAvatar} />
          ) : (
            <View style={[styles.headerAvatar, {backgroundColor: '#ddd'}]} />
          )}
          <View style={{flex: 1}}>
            <Text style={styles.modalTitle} numberOfLines={1}>
              {selectedItem.title ?? '제목 없음'}
            </Text>
            {!!selectedItem.author && (
              <Text style={styles.modalAuthor}>@{selectedItem.author}</Text>
            )}
          </View>
        </View>
        {!!selectedItem.description && (
          <Text style={styles.modalDescription}>
            {selectedItem.description}
          </Text>
        )}
        <View style={styles.divider} />
        <Text style={styles.commentsTitle}>댓글</Text>
      </View>
    );

    const Floating = (
      <Animated.View
        onLayout={e => setFloatingH(e.nativeEvent.layout.height)}
        style={[
          styles.floatingWrap,
          {transform: [{translateY: Animated.multiply(kbAnim, -1)}]},
          {paddingBottom: keyboardVisible ? 8 : 25},
        ]}>
        <Image source={HanbatLogo} style={styles.inputAvatar} />
        <View style={styles.inputBox}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={
              replyParentId ? '답글 작성하기...' : '댓글 작성하기...'
            }
            placeholderTextColor="#888"
            value={text}
            onChangeText={setText}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            onFocus={() => setModalH(H90)}
            onBlur={() => setModalH(H60)}
            blurOnSubmit={false}
          />
          {replyParentId && (
            <TouchableOpacity
              onPress={() => setReplyParentId(null)}
              style={{marginRight: 8}}>
              <Text style={{fontSize: 12, color: '#61402D'}}>답장취소</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleSend}>
            <Icon
              name="paper-plane"
              size={20}
              color={'#61402D'}
              style={{transform: [{rotate: '20deg'}]}}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );

    return (
      <Modalize
        ref={ref}
        adjustToContentHeight={false}
        modalHeight={modalH}
        modalStyle={styles.modal}
        handlePosition="inside"
        onOpened={refresh}
        onClosed={() => {
          setText('');
          setReplyParentId(null);
          setModalH(H60);
          onClose?.();
        }}
        keyboardAvoidingBehavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardAvoidingOffset={Platform.OS === 'ios' ? 16 : 0}
        flatListProps={{
          data: parents,
          keyExtractor: it => String(it.treasureHuntPostCommentId),
          onEndReachedThreshold: 0.4,
          onEndReached: () => hasNext && loadMore(),
          refreshing,
          onRefresh: refresh,
          keyboardShouldPersistTaps: 'handled',
          contentContainerStyle: {paddingBottom: floatingH + 12},
          ListHeaderComponent: Header,
          stickyHeaderIndices: [0],
          renderItem: ({item: parent}) => (
            <View style={styles.commentItem}>
              {/* 1행: 부모 댓글 */}
              <View style={styles.parentRow}>
                {!!parent.profileImageUrl ? (
                  <Image
                    source={getLocalProfileImage(parent.profileImageUrl)}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={[styles.avatar, {backgroundColor: '#ddd'}]} />
                )}

                <View style={styles.commentContentRow}>
                  <View style={styles.commentMain}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.userName} numberOfLines={1}>
                        {parent.userName}
                      </Text>
                      <Text style={styles.commentDate}>
                        {new Date(parent.createdAt).toLocaleString()}
                      </Text>
                    </View>

                    <Text style={styles.commentText}>{parent.comment}</Text>

                    <View style={styles.commentActions}>
                      <TouchableOpacity
                        onPress={() =>
                          handleReplyPress(
                            parent.treasureHuntPostCommentId as number,
                          )
                        }>
                        <Text style={styles.replyText}>답장</Text>
                      </TouchableOpacity>

                      {isMine(parent.appUserId) && (
                        <TouchableOpacity
                          onPress={() =>
                            handleDeleteParent(
                              parent.treasureHuntPostCommentId as number,
                            )
                          }>
                          <Text style={styles.replyText}>삭제</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  <View style={styles.heartWrapper}>
                    <Icon name="heart-outline" size={18} color={'#E06167'} />
                    <Text style={styles.iconLabel}>{parent.likeCount}</Text>
                  </View>
                </View>
              </View>

              {/* 2행: 대댓글 */}
              <View style={styles.repliesRow}>
                <View style={{width: LEFT_SPACER}} />
                <View style={styles.repliesRight}>
                  <RepliesPreview
                    postId={postId}
                    parentId={parent.treasureHuntPostCommentId as number}
                    previewCount={2}
                    registerAddReply={fn => {
                      addReplyMap.current[
                        parent.treasureHuntPostCommentId as number
                      ] = fn;
                    }}
                    canDelete={isMine}
                    onDeleted={() =>
                      handleChildDeleted(
                        parent.treasureHuntPostCommentId as number,
                      )
                    }
                    onReply={handleReplyPress}
                    heartColWidth={HEART_COL_W}
                    indent={12}
                  />
                </View>
              </View>
            </View>
          ),
          ListEmptyComponent: !loading ? (
            <Text style={styles.emptyText}>
              아직 댓글이 없어요. 첫 댓글을 남겨보세요!
            </Text>
          ) : null,
        }}
        FloatingComponent={Floating}
      />
    );
  },
);

export default CommentModal;

const styles = StyleSheet.create({
  // 모달 외형
  modal: {
    backgroundColor: '#ECE9E1',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 40,
  },

  // Sticky header
  stickyHeader: {
    backgroundColor: '#ECE9E1',
    paddingBottom: 15,
    zIndex: 1,
    ...Platform.select({android: {elevation: 2}}),
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 8,
    marginLeft: 10,
  },
  headerAvatar: {width: 36, height: 36, borderRadius: 18},
  modalTitle: {fontSize: 16, fontWeight: '600', color: '#242424'},
  modalAuthor: {fontSize: 12, color: '#666', marginTop: 2},
  modalDescription: {
    fontSize: 13,
    color: '#242424',
    lineHeight: 18,
    paddingVertical: 12,
    marginLeft: 36,
  },
  divider: {
    height: 1,
    backgroundColor: '#e3ded6',
    marginVertical: 14,
    width: '90%',
    alignSelf: 'center',
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '500',
    alignSelf: 'center',
    color: '#61402D',
    marginBottom: 8,
  },
  emptyText: {color: '#777', textAlign: 'center', marginVertical: 16},

  // ===== 댓글 아이템: 세로(column) 구성 =====
  commentItem: {
    flexDirection: 'column',
    width: '100%',
    marginBottom: 18,
    paddingLeft: LEFT_PADDING,
  },

  // 1행: 부모 댓글(가로)
  parentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
  },
  avatar: {
    width: AVATAR_W,
    height: AVATAR_W,
    borderRadius: AVATAR_W / 2,
    marginRight: AVATAR_GAP,
    backgroundColor: '#ddd',
  },
  commentContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flex: 1,
  },
  commentMain: {flexShrink: 1, flexGrow: 1, paddingRight: 12},
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 2,
  },
  userName: {
    fontWeight: '600',
    fontSize: 12,
    color: '#242424',
    maxWidth: '70%',
  },
  commentDate: {fontSize: 10, color: '#999'},
  commentText: {fontSize: 13, color: '#242424', marginTop: 2},
  commentActions: {flexDirection: 'row', gap: 12, marginTop: 6},
  replyText: {fontSize: 12, color: '#888'},

  // 우측 하트 열(부모)
  heartWrapper: {alignItems: 'center', width: HEART_COL_W, paddingTop: 6},
  iconLabel: {fontSize: 11, color: '#222', marginTop: 2},

  // 2행: 대댓글
  repliesRow: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 6,
  },
  repliesRight: {
    flex: 1,
  },

  // 하단 플로팅 입력창
  floatingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    backgroundColor: '#ECE9E1',
  },
  inputAvatar: {width: 32, height: 32, borderRadius: 16, marginRight: 8},
  inputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D6D1C6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  input: {flex: 1, fontSize: 14, color: '#333'},
});
