import ProductModel from "../models/ProductModel.js";

export const getProducts = async (req, res) => {
  try {
    const products = await ProductModel.fetch();
    res.status(200).json(products.rows);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const getProduct = async (req, res) => {
  const { id } = await req.params;
  try {
    const product = await ProductModel.find(id);
    res.status(200).json(product.rows[0]);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const addProduct = async (req, res) => {
  const product = new ProductModel(
    null,
    req.body.name,
    req.body.price,
    req.body.selectedFiles
  );
  product
    .save()
    .then((product) => {
      res.status(201).json(product.rows[0]);
    })
    .catch((err) => res.status(409).json({ message: err.message }));
};

export const updateProduct = async (req, res) => {
  const { id: _id } = await req.params;
  const productData = await req.body;
  const product = new ProductModel(
    _id,
    productData.name,
    productData.price,
    productData.selectedFiles
  );
  product
    .update()
    .then((product) => {
      res.status(200).json(product.rows[0]);
    })
    .catch((err) => res.json({ message: err.message }));
};

export const deleteProduct = async (req, res) => {
  const { id } = await req.params;
  ProductModel.delete(id)
    .then(() => {
      res.json({ message: "Product deleted successfully" });
    })
    .catch((err) => res.json({ message: err.message }));
};
