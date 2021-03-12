const styleContainer = {
  padding: '10px',
  'margin-bottom': '5px',
};

const Container = ({ children }) => {
  return (
    <div style={styleContainer} className="container border rounded">
      {children}
    </div>
  );
};

export default Container;
