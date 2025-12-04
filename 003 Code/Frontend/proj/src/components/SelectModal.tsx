import React, {forwardRef} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, FlatList} from 'react-native';
import {Modalize} from 'react-native-modalize';
import Icon from 'react-native-vector-icons/Ionicons';

interface Option {
  label: string;
  value: string;
}

interface SelectModalProps {
  title: string;
  options: Option[];
  selectedValue: string;
  onSelect: (value: string) => void;
}

const SelectModal = forwardRef<Modalize, SelectModalProps>(
  ({title, options, selectedValue, onSelect}, ref) => {
    return (
      <Modalize
        ref={ref}
        modalStyle={styles.modal}
        adjustToContentHeight
        handlePosition="inside">
        <View style={styles.container}>
          <Text style={styles.title}>{title}</Text>
          <FlatList
            data={options}
            keyExtractor={item => item.value}
            renderItem={({item}) => (
              <TouchableOpacity
                style={styles.option}
                onPress={() => onSelect(item.value)}>
                <Text style={styles.label}>{item.label}</Text>
                {selectedValue === item.value ? (
                  <Icon name="checkmark-circle" size={25} color="#61402D" />
                ) : (
                  <Icon
                    name="checkmark-circle-outline"
                    size={25}
                    color="#A19E9E"
                  />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modalize>
    );
  },
);

export default SelectModal;

const styles = StyleSheet.create({
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    backgroundColor: '#EEEEEE',
  },
  container: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
    color: '#242424',
    marginVertical: 30,
  },
  option: {
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '300',
    color: '#2a2a2a',
  },
});
