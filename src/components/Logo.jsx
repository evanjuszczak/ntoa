import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const Logo = ({ size = 40, ...props }) => {
  const theme = useTheme();
  
  return (
    <Box
      {...props}
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        display: 'flex',
        position: 'relative',
        ...props.sx
      }}
    >
      <Box
        sx={{
          width: '50%',
          height: '100%',
          backgroundColor: theme.palette.mode === 'dark' ? '#FFFFFF' : '#000000',
        }}
      />
      <Box
        sx={{
          width: '50%',
          height: '100%',
          backgroundColor: theme.palette.mode === 'dark' ? '#000000' : '#FFFFFF',
          borderLeft: `1px solid ${theme.palette.mode === 'dark' ? '#000000' : '#FFFFFF'}`
        }}
      />
    </Box>
  );
};

export default Logo; 