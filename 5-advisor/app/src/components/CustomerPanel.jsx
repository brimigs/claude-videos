import React from 'react';

class CustomerPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = { account: null };
  }

  componentDidMount() {
    this.props.client.getAccount(this.props.customerId).then((account) => {
      this.setState({ account });
    });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.customerId !== this.props.customerId) {
      this.props.client.getAccount(this.props.customerId).then((account) => {
        this.setState({ account });
      });
    }
  }

  render() {
    const { account } = this.state;
    if (!account) return null;
    return (
      <aside className="customer-panel">
        <h3>{account.name}</h3>
        <p>Plan: {account.plan}</p>
        <p>Status: {account.account_status}</p>
        <p>Support tier: {account.support_tier}</p>
      </aside>
    );
  }
}

export default CustomerPanel;
