import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export default function ServiceTermsContent() {
  return (
    <View style={{paddingBottom: 20}}>
      <View style={{flexDirection: 'row', alignItems: 'center'}}>
        <Text style={styles.tabiFont}>TaBi</Text>
        <Text style={styles.title}> 서비스 이용약관</Text>
      </View>

      <Text style={styles.heading}>제 1 조 (목적)</Text>
      <Text style={styles.paragraph}>
        본 약관은 TABI(이하 "회사")가 제공하는 여행 계획 SNS 플랫폼 서비스(이하
        "서비스")의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임 사항을
        규정함을 목적으로 합니다.
      </Text>

      <Text style={styles.heading}>제 2 조 (정의)</Text>
      <Text style={styles.paragraph}>
        1. "서비스"라 함은 회사가 운영하는 여행 계획 SNS 플랫폼 및 관련 제반
        서비스를 의미합니다.
      </Text>
      <Text style={styles.paragraph}>
        2. "회원"이라 함은 본 약관에 동의하고 서비스를 이용하는 자를 의미합니다.
      </Text>
      <Text style={styles.paragraph}>
        3. "콘텐츠"라 함은 회원이 서비스 내에 게시하는 여행 계획, 리뷰, 사진,
        댓글 등을 포함합니다.
      </Text>
      <Text style={styles.paragraph}>
        4. "계정"이라 함은 회원이 서비스 이용을 위해 등록한 ID와 비밀번호 등의
        정보를 의미합니다.
      </Text>

      <Text style={styles.heading}>제 3 조 (약관의 효력 및 변경)</Text>
      <Text style={styles.paragraph}>
        1. 본 약관은 회원이 서비스에 가입할 때 동의함으로써 효력이 발생합니다.
      </Text>
      <Text style={styles.paragraph}>
        2. 회사는 관련 법령을 위배하지 않는 범위 내에서 약관을 변경할 수 있으며,
        변경 시 사전에 공지합니다.
      </Text>
      <Text style={styles.paragraph}>
        3. 회원이 변경된 약관에 동의하지 않을 경우, 서비스 이용을 중단하고
        계정을 탈퇴할 수 있습니다.
      </Text>

      <Text style={styles.heading}>제 4 조 (서비스 이용)</Text>
      <Text style={styles.paragraph}>
        1. 회원은 본 약관 및 관련 법령을 준수하여 서비스를 이용해야 합니다.
      </Text>
      <Text style={styles.paragraph}>
        2. 회사는 서비스의 운영을 위해 필요한 경우 일부 기능을 제한하거나 변경할
        수 있습니다.
      </Text>

      <Text style={styles.heading}>제 5 조 (회원의 의무)</Text>
      <Text style={styles.paragraph}>
        1. 회원은 정확한 정보를 제공해야 하며, 타인의 정보를 도용해서는 안
        됩니다.
      </Text>
      <Text style={styles.paragraph}>
        2. 서비스 이용 중 타인에게 피해를 주거나 불법적인 활동을 해서는 안
        됩니다.
      </Text>
      <Text style={styles.paragraph}>
        3. 회원이 업로드한 콘텐츠는 서비스 운영 및 홍보 목적으로 활용될 수
        있습니다.
      </Text>

      <Text style={styles.heading}>제 6 조 (개인정보 보호)</Text>
      <Text style={styles.paragraph}>
        1. 회사는 회원의 개인정보를 보호하며, 관련 법령에 따라 이를 적절히
        관리합니다.
      </Text>
      <Text style={styles.paragraph}>
        2. 개인정보의 수집 및 이용에 대한 상세한 내용은 개인정보 처리방침을
        따릅니다.
      </Text>

      <Text style={styles.heading}>제 7 조 (서비스의 제공 및 변경)</Text>
      <Text style={styles.paragraph}>
        1. 회사는 회원에게 원활한 서비스 제공을 위해 최선을 다합니다.
      </Text>
      <Text style={styles.paragraph}>
        2. 서비스는 일부 기능이 추가되거나 변경될 수 있으며, 이 경우 사전
        공지됩니다.
      </Text>

      <Text style={styles.heading}>제 8 조 (이용 제한 및 계정 해지)</Text>
      <Text style={styles.paragraph}>
        1. 회원이 본 약관을 위반하거나 불법적인 활동을 하는 경우 서비스 이용이
        제한될 수 있습니다.
      </Text>
      <Text style={styles.paragraph}>
        2. 회원은 언제든지 계정을 탈퇴할 수 있으며, 회사는 관련 법령에 따라
        데이터를 처리합니다.
      </Text>

      <Text style={styles.heading}>제 9 조 (책임 제한)</Text>
      <Text style={styles.paragraph}>
        1. 회사는 천재지변, 시스템 장애 등의 불가항력적인 사유로 인해 서비스가
        중단될 경우 책임을 지지 않습니다.
      </Text>
      <Text style={styles.paragraph}>
        2. 회사는 회원이 게시한 콘텐츠에 대한 책임을 지지 않으며, 회원 본인이
        모든 책임을 부담합니다.
      </Text>

      <Text style={styles.heading}>제 10 조 (준거법 및 관할법원)</Text>
      <Text style={styles.paragraph}>
        1. 본 약관은 대한민국 법률을 준거법으로 합니다.
      </Text>
      <Text style={styles.paragraph}>
        2. 서비스 이용과 관련된 분쟁이 발생할 경우, 관할 법원은 대한민국
        서울중앙지방법원으로 합니다.
      </Text>

      <Text style={styles.heading}>부칙</Text>
      <Text style={styles.paragraph}>
        본 약관은 2025년 3월 28일부터 적용됩니다.
      </Text>
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
    marginBottom: 6,
  },
});
