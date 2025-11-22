const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://127.0.0.1:8000';

export const apiService = {
  async getProducts() {
    const response = await fetch(`${API_URL}/products/`);
    if (!response.ok) throw new Error('Failed to fetch products');
    return response.json();
  },

  async getClients() {
    const response = await fetch(`${API_URL}/users/`);
    if (!response.ok) throw new Error('Failed to fetch clients');
    // Filter users to find clients if necessary, or just return all users for now
    // Ideally the backend should have a specific endpoint or filter
    return response.json();
  },

  async getRoles() {
    const response = await fetch(`${API_URL}/roles/`);
    if (!response.ok) throw new Error('Failed to fetch roles');
    return response.json();
  },

  async createClient(clientData: any) {
    // Fetch roles to find 'client' role ID
    let roleId = 2; // Default fallback
    try {
        const roles = await this.getRoles();
        const clientRole = roles.find((r: any) => r.name === 'client');
        if (clientRole) roleId = clientRole.id;
    } catch (e) {
        console.warn("Could not fetch roles, using default ID", e);
    }

    const payload = {
      name: clientData.name,
      email: clientData.email || `${clientData.cpf.replace(/\D/g, '')}@client.store`, // Generate dummy email if missing
      cpf: clientData.cpf,
      phone: clientData.phone,
      address: clientData.address,
      birth_date: clientData.birth_date,
      client_type: clientData.client_type,
      password: "default_client_password", // Dummy password
      role_id: roleId
    };

    const response = await fetch(`${API_URL}/users/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create client');
    }
    return response.json();
  },

  async deleteClient(clientId: string) {
    const response = await fetch(`${API_URL}/users/${clientId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete client');
    return response.json();
  },

  async updateClient(clientId: string, clientData: any) {
    const payload: any = {
      name: clientData.name,
      cpf: clientData.cpf,
      phone: clientData.phone,
      address: clientData.address,
      birth_date: clientData.birth_date,
      client_type: clientData.client_type,
    };
    
    if (clientData.email) {
        payload.email = clientData.email;
    }

    const response = await fetch(`${API_URL}/users/${clientId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update client');
    }
    return response.json();
  },

  async getOrders() {
    const response = await fetch(`${API_URL}/orders/`);
    if (!response.ok) throw new Error('Failed to fetch orders');
    return response.json();
  },

  async createOrder(orderData: any) {
    // Transform frontend sale data to backend order data
    // Frontend sends: { client_id, seller_id, payment_method_id, items: [...], ... }
    // Backend expects: OrderCreate schema
    
    const payload = {
      user_id: orderData.client_id ? parseInt(orderData.client_id) : null, // Assuming client_id is user_id
      items: orderData.items.map((item: any) => ({
        product_id: parseInt(item.product_id),
        quantity: item.quantity,
        unit_price: item.unit_price
      })),
      payment_method: orderData.payment_method_id
    };

    const response = await fetch(`${API_URL}/orders/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create order');
    }
    return response.json();
  }
};
