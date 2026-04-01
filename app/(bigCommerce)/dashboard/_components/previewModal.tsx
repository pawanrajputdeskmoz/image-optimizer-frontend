import { Api } from "@/app/_api/apiCall";
import { useEffect, useState } from "react";
import { Modal, Spinner } from "react-bootstrap";

export default function Home(Props: any) {
  const [oldData, setOldData] = useState<any>({
    image: "",
    name: "",
    size: "",
    altText: "",
  });
  const [shop, setShop] = useState<any>("");
  const [loading, setLoading] = useState(false);

  const getPreviewImgData = () => {
    setLoading(true);
    Api("imageOptimizer/getPreviewImgData", {
      product_id: Props.image.product_id,
      image_id: Props.image.id,
    }).then(({ data }) => {
      setOldData({
        image: data.image_url,
        name: data.old_file_name,
        size: data.image_size,
        altText: data.old_alt_text,
      });
      setLoading(false);
    });
  };

  useEffect(() => {
    setShop(localStorage?.getItem("shop"));
  }, []);
  return (
    <>
      <Modal
        show={Props.show}
        onHide={Props.onHide}
        size="lg"
        centered={true}
        onShow={getPreviewImgData}
      >
        <Modal.Header closeButton={true}>
          <h1 className="fs-5">Optimize Preview</h1>
        </Modal.Header>
        <Modal.Body>
          <div className="optimizePreview-modalArea d-grid grid-column-2">
            <div className="optimizePreview-left separator-right text-align-center">
              <h1 className="Text--headingLg">Old</h1>

              <div className="OptimizeModal-Image">
                {loading ? (
                  <Spinner size="sm" />
                ) : (
                  <img src={oldData.image} width="210" height="210" />
                )}
              </div>

              <div className="OptimizeImageInfo">
                <ul>
                  <li>
                    <span>Name:</span>
                    <label>
                      {loading ? <Spinner size="sm" /> : oldData.name}
                    </label>
                  </li>
                  <li>
                    <span>Size:</span>
                    <label>
                      {loading ? <Spinner size="sm" /> : oldData.size}
                    </label>
                  </li>
                  <li>
                    <span>Alt Text:</span>
                    <label>
                      {loading ? <Spinner size="sm" /> : oldData.altText}
                    </label>
                  </li>
                </ul>
              </div>
            </div>

            <div className="optimizePreview-left text-align-center">
              <h1 className="Text--headingLg">New</h1>

              <div className="OptimizeModal-Image">
                <img
                  src={`https://store-${shop}.mybigcommerce.com/product_images/${Props.image.image_file}`}
                  width="210"
                  height="210"
                />
              </div>

              <div className="OptimizeImageInfo">
                <ul>
                  <li>
                    <span>Name:</span>
                    <label>{Props.image.image_file.split("/").pop()}</label>
                  </li>
                  <li>
                    <span>Size:</span>
                    <label>{Props.size}</label>
                  </li>
                  <li>
                    <span>Alt Text:</span>
                    <label>{Props.image.description}</label>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="custom-btn"
            onClick={() => {
              Props.RestoreOptimizeImage();
              Props.onHide();
            }}
          >
            Restore
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
