import React from 'react';
import {Text, View, StyleSheet, ScrollView} from 'react-native';
import {useRoute} from '@react-navigation/native';
import ServiceTermsContent from '../../components/ServiceTermsContent';
import PrivacyPolicyContent from '../../components/PrivacyPolicyContent';

function TermsDetail() {
  const route = useRoute<any>();
  const {termType} = route.params;

  const renderContent = () => {
    if (termType === 'service') {
      return <ServiceTermsContent />;
    } else if (termType === 'privacy') {
      return <PrivacyPolicyContent />;
    } else {
      return <Text>알 수 없는 약관 유형입니다.</Text>;
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.mainContainer}>
      {renderContent()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    paddingHorizontal: 20,
    backgroundColor: '#ECE9E1',
    paddingBottom: 20,
    flexGrow: 1,
    paddingTop: 20,
  },
});

export default TermsDetail;
