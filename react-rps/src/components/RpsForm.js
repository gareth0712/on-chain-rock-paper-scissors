import Container from './Container';

const RpsForm = ({ onSubmit, input, setInput, hostOnly, host, player, header, label }) => {
  return (
    <Container>
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
        <button disabled={hostOnly ? host !== player : false}>{header}</button>
      </form>
    </Container>
  );
};

export default RpsForm;
