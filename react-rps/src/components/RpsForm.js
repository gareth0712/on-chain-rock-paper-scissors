import Container from './Container';

const RpsForm = ({ className, onSubmit, input, setInput, hostOnly, host, player, header, label }) => {
  return (
    <div className={className}>
      <Container haveBorder={false}>
        <form onSubmit={onSubmit}>
          <h4>{header}</h4>
          <div className="mb-3">
            <label className="form-label">{label}</label>
            <input
              className="form-control"
              disabled={hostOnly ? host !== player : false}
              value={input}
              onChange={(event) => setInput(event.target.value.replace(/\D/, ''))}
            />
            <label> Gwei</label>
          </div>
          <button className="btn btn-primary" disabled={hostOnly ? host !== player : false}>
            {header}
          </button>
        </form>
      </Container>
    </div>
  );
};

export default RpsForm;
