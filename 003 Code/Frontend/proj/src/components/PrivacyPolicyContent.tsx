import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export default function PrivacyPolicyContent() {
  return (
    <View style={{paddingBottom: 20}}>
      <View style={{flexDirection: 'row', alignItems: 'center'}}>
        <Text style={styles.tabiFont}>TaBi</Text>
        <Text style={styles.title}> 개인정보 처리방침</Text>
      </View>

      <Text style={styles.heading}>1. 개인정보의 수집 및 이용 목적</Text>
      <Text style={styles.paragraph}>
        회사는 다음의 목적을 위해 회원의 개인정보를 수집 및 이용합니다.
      </Text>
      <Bullet>회원 가입 및 본인 인증</Bullet>
      <Bullet>서비스 제공 및 운영</Bullet>
      <Bullet>고객 문의 및 불만 처리</Bullet>
      <Bullet>서비스 개선 및 맞춤형 서비스 제공</Bullet>

      <Text style={styles.heading}>2. 수집하는 개인정보 항목</Text>
      <Bullet>필수 정보: 이름, 이메일 주소, 휴대폰 번호, 비밀번호</Bullet>
      <Bullet>선택 정보: 프로필 사진, 여행 관심 지역</Bullet>

      <Text style={styles.heading}>3. 개인정보의 보유 및 이용 기간</Text>
      <Bullet>
        회원 탈퇴 후 즉시 삭제하며, 법령에 따라 일정 기간 보관이 필요한 경우
        해당 법령을 따릅니다.
      </Bullet>

      <Bullet sub>
        전자상거래 등에서의 소비자 보호에 관한 법률에 따른 보관
      </Bullet>
      <Bullet sub2>계약 또는 청약철회 등에 관한 기록: 5년</Bullet>
      <Bullet sub2>대금 결제 및 재화 등의 공급에 관한 기록: 5년</Bullet>
      <Bullet sub2>소비자의 불만 또는 분쟁처리에 관한 기록: 3년</Bullet>
      <Bullet sub2>통신판매업에 관한 기록: 6개월</Bullet>

      <Bullet sub>통신비밀보호법에 따른 보관</Bullet>
      <Bullet sub2>로그인 기록: 3개월</Bullet>

      <Text style={styles.heading}>4. 개인정보 제공 및 위탁</Text>
      <Text style={styles.paragraph}>
        회사는 원칙적으로 회원의 개인정보를 외부에 제공하지 않습니다. 다만,
        서비스 운영을 위해 필요한 경우 회원의 동의를 받아 외부 업체에 위탁할 수
        있으며, 위탁 업체와 계약을 통해 개인정보 보호를 철저히 관리합니다.
      </Text>

      <Text style={styles.heading}>5. 동의 거부 권리 및 거부 시 불이익</Text>
      <Text style={styles.paragraph}>
        회원은 개인정보 수집 및 이용에 대한 동의를 거부할 권리가 있습니다. 다만,
        필수 정보 제공에 동의하지 않을 경우 서비스 이용이 제한될 수 있습니다.
      </Text>
    </View>
  );
}

function Bullet({
  children,
  sub = false,
  sub2 = false,
}: {
  children: React.ReactNode;
  sub?: boolean;
  sub2?: boolean;
}) {
  return (
    <View
      style={[
        styles.bulletItem,
        sub && {paddingLeft: 12},
        sub2 && {paddingLeft: 24},
      ]}>
      <Text style={styles.bullet}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tabiFont: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#61402D',
    marginTop: 20,
    marginBottom: 8,
    fontFamily: 'Madimi One',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#61402D',
    marginTop: 20,
    marginBottom: 8,
  },
  heading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#61402D',
    marginTop: 20,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    color: '#61402D',
    lineHeight: 22,
    marginBottom: 10,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  bullet: {
    marginRight: 6,
    fontSize: 14,
    lineHeight: 22,
    color: '#61402D',
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: '#61402D',
    lineHeight: 22,
  },
});
