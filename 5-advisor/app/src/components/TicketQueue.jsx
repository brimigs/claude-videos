import React from 'react';

class TicketQueue extends React.Component {
  constructor(props) {
    super(props);
    this.state = { tickets: [], loading: true, filter: 'open' };
  }

  componentDidMount() {
    this.loadTickets();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.filter !== this.state.filter) {
      this.loadTickets();
    }
  }

  loadTickets() {
    this.setState({ loading: true });
    this.props.client.listTickets(this.state.filter).then((tickets) => {
      this.setState({ tickets, loading: false });
    });
  }

  handleFilterChange = (event) => {
    this.setState({ filter: event.target.value });
  };

  render() {
    const { tickets, loading, filter } = this.state;
    return (
      <div className="ticket-queue">
        <select value={filter} onChange={this.handleFilterChange}>
          <option value="open">Open</option>
          <option value="escalated">Escalated</option>
          <option value="closed">Closed</option>
        </select>
        {loading ? (
          <p>Loading tickets...</p>
        ) : (
          <ul>
            {tickets.map((ticket) => (
              <li key={ticket.id} onClick={() => this.props.onSelect(ticket.id)}>
                {ticket.customerName} — {ticket.subject}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
}

export default TicketQueue;
