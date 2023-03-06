import ClientModel from "../models/ClientModel.js";

export const getClient = async (req, res) => {
  const { id } = await req.params;
  try {
    const client = await ClientModel.find(id);
    res.status(200).json(client.rows[0]);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const getClients = async (req, res) => {
  try {
    const clients = await ClientModel.fetch();
    res.status(200).json(clients.rows);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const addClient = async (req, res) => {
  const client = new ClientModel(
    null,
    req.body.name,
    req.body.email,
    req.body.phone,
    req.body.address
  );
  client
    .save()
    .then((client) => {
      res.status(201).json(client.rows[0]);
    })
    .catch((err) => res.status(409).json({ message: err.message }));
};

export const updateClient = async (req, res) => {
  const { id: _id } = await req.params;
  const ClientData = await req.body;
  const client = new ClientModel(
    _id,
    ClientData.name,
    ClientData.email,
    ClientData.phone,
    ClientData.address
  );
  client
    .update()
    .then((client) => {
      res.status(200).json(client.rows[0]);
    })
    .catch((err) => res.json({ message: err.message }));
};

export const deleteClient = async (req, res) => {
  const { id } = await req.params;
  ClientModel.delete(id)
    .then(() => {
      res.json({ message: "Client deleted successfully" });
    })
    .catch((err) => res.json({ message: err.message }));
};
