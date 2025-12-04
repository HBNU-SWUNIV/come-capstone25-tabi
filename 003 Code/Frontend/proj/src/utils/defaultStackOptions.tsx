import CustomStackHeader from './CustomStackHeader';

export const defaultStackOptions = () => ({
  header: () => {
    return <CustomStackHeader />;
  },
  contentStyle: {
    backgroundColor: '#ECE9E1',
  },
});
