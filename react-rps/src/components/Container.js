const styleContainer = {
  padding: '10px',
  'margin-bottom': '5px',
};

const Container = ({ haveBorder = true, children }) => {
  let className = 'container';
  className += haveBorder ? ' border' : '';

  return (
    <div style={styleContainer} className={className}>
      {children}
    </div>
  );
};

export default Container;
