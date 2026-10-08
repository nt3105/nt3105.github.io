# Ngân Tú — Website cá nhân

Website tĩnh HTML/CSS/JavaScript, giữ nguyên nội dung hai dự án hiện có.

## Đưa lên GitHub Pages

1. Giải nén ZIP.
2. Mở thư mục `nt3105.github.io-main` và tải các tệp bên trong lên thư mục gốc của repository `nt3105.github.io`. Không tải cả thư mục lồng bên ngoài.
3. Commit thay đổi. Giữ thiết lập GitHub Pages đang dùng của repository; đợi GitHub xuất bản phiên bản mới.
4. Mở website, tải lại bằng Ctrl+F5 nếu vẫn hiện phiên bản cũ.

Website này mặc định dùng địa chỉ `https://nt3105.github.io/`. Nếu đổi tên miền, cập nhật canonical, og:url, og:image, twitter:image trong hai tệp HTML, cùng robots.txt và sitemap.xml.

## Xem trên máy

Trong thư mục website, chạy `python -m http.server 8000`, rồi mở `http://localhost:8000/`. Mở trực tiếp index.html cũng đọc được trang chính, nhưng intro dùng fetch nên cần chạy qua HTTP.

## Những phần đã hoàn thiện

- Giữ link tới mục cụ thể như `/#contact`, `/#projects`; không ép cuộn về đầu trang.
- Intro chỉ tự hiện một lần mỗi phiên; bỏ qua khi mở link tới từng mục, bật giảm chuyển động, tiết kiệm dữ liệu hoặc mở file cục bộ. Nút xem lại nằm ở chân trang.
- Intro có nút bỏ qua, giới hạn thời gian tải và đường lui thử lại/mở trực tiếp khi lỗi. Nội dung và metadata của trang chính được giữ khi chuyển từ intro.
- Ảnh chia sẻ 1200 × 630, canonical, Twitter Card, icon cho màn hình chính, robots.txt và sitemap.xml.
- Ảnh dưới màn hình đầu tải lười. Nhạc chờ người dùng bấm phát; không tự bật âm thanh khi chạm vào chức năng khác.
- Biểu mẫu kiểm tra dữ liệu, hỗ trợ soạn Gmail/Mail và sao chép lời nhắn; khi trình duyệt không cho sao chép tự động, cung cấp ô nội dung để chọn thủ công.
- QR loại bỏ yêu cầu cũ khi sửa số tiền; không cập nhật lại mã sau khi yêu cầu đã lỗi/hết thời gian chờ.
- Game dừng vòng vẽ khi đóng hoặc ẩn trang; nút Chơi lại bắt đầu ván mới, chống đổi hướng ngược trong cùng nhịp và hoạt động khi lưu dữ liệu bị chặn.
- Cải thiện bàn phím, focus, kích thước nút và cỡ chữ biểu mẫu trên điện thoại; rút gọn một số nội dung lặp.

## Cách hoạt động của liên hệ và QR

Website không có máy chủ gửi thư. Bấm soạn Gmail/Mail tạo bản nháp; người dùng phải bấm Gửi trong hộp thư. Nút sao chép không gửi tin nhắn. Gửi trực tiếp trên website cần cấu hình dịch vụ biểu mẫu hoặc API riêng.

QR số tiền tải qua img.vietqr.io; cần Internet. Mã chỉ điền sẵn thông tin, không thực hiện hay xác nhận giao dịch. Kiểm tra thông tin người nhận trong ứng dụng ngân hàng.

Các tuỳ chọn giao diện và điểm game lưu tại trình duyệt; chúng không được gửi về máy chủ website.

## Kiểm tra đã thực hiện

- Kiểm tra cú pháp JavaScript, script trong HTML, các tệp tài nguyên, link nội bộ và ID trùng.
- So sánh nội dung phần dự án với bản gốc: giữ nguyên.
- Kiểm tra DOM giả lập cho khởi tạo trang, menu, liên hệ, giới hạn số tiền, yêu cầu QR cũ/lỗi, game, tìm kiếm nhanh và lưu trữ bị chặn.
- Kiểm tra DOM giả lập cho chuyển từ intro sang trang chính và lỗi tải intro.

Chưa xác nhận hiển thị thực tế trên trình duyệt/điện thoại: môi trường kiểm tra chặn mở bản web nội bộ. Các kiểm tra DOM không thay thế kiểm tra bố cục, phát âm thanh hoặc tương thích cảm biến trên thiết bị thật.

## Tiện ích trên website

1. **Góc code**: ba tab C, Objective-C, Swift; điều khiển bằng phím mũi tên/Home/End; sao chép có đường lui khi trình duyệt chặn clipboard. Đây là ví dụ để sao chép chạy trên máy, không phải trình biên dịch trong web.
2. **Nhật ký học tập**: các cập nhật hiện có trong `journal-data.js`, lọc Học tập/Website. Muốn đăng bài mới, thêm một đối tượng vào đầu `window.NT_JOURNAL`, rồi cập nhật tệp đó trên GitHub. Nội dung là văn bản thuần; không chèn HTML vào bài viết.
3. **Chia sẻ**: mở hộp chia sẻ từ màn hình đầu, sao chép link, dùng menu chia sẻ của thiết bị nếu được hỗ trợ hoặc tải QR. QR nằm trong `images/share-qr.png`, trỏ tới https://nt3105.github.io/ và không gọi dịch vụ QR bên ngoài. Nếu đổi tên miền, cần tạo lại ảnh QR cùng lúc cập nhật canonical.
4. **Menu game kiểu iOS**: bấm Tuỳ chỉnh trong game để mở bảng cài đặt. Trên điện thoại, bảng hiện từ đáy màn hình; trên máy tính, hiện ở giữa. Game tự tạm dừng khi mở; đóng bảng sẽ tiếp tục nếu trước đó đang chơi. Có công tắc, thanh tốc độ và cấu hình chọn nhanh. Menu dùng HTML/CSS/JavaScript, không dùng Swift hay Objective-C.
5. **Thành tích Snake**: chọn Dễ/Vừa/Khó trước ván mới. Khi đổi lựa chọn giữa ván, bấm Chơi lại để áp dụng. Chỉ ván kết thúc mới được lưu; bỏ dở không ghi điểm. Lưu 5 điểm cao nhất cho từng mức và từng chế độ chơi thường/có hỗ trợ trên máy này. Bật hỗ trợ rồi tắt lại vẫn tính là ván hỗ trợ. Không phải bảng xếp hạng trực tuyến.

Các chức năng mới đã qua kiểm tra DOM giả lập, bao gồm lưu điểm từ vòng chơi thực tế của mã game, phân loại ván hỗ trợ, chuyển độ khó khi chơi lại, đóng/mở menu và tạm dừng/tiếp tục. Vẫn cần thử giao diện và tính năng chia sẻ bản địa trên thiết bị thật.

## Cập nhật giao diện

Đã bỏ chế độ sáng/tối và tự nhận màu thiết bị. Website dùng nền tối cố định; bảng đổi màu nhấn vẫn hoạt động. Đã thêm Java vào Kỹ năng & công cụ, cùng Objective-C và Swift ở mức đang tìm hiểu.

## Hoàn thiện hình thức

`design.css` bổ sung bốn thẻ truy cập nhanh có icon, nhãn và mô tả; đồng bộ thẻ kỹ năng, nhật ký, bảng thành tích và hộp chia sẻ. Góc code có thanh tiêu đề kiểu cửa sổ. Hiệu ứng nhấc thẻ chỉ áp dụng cho thiết bị có chuột và được tắt khi người dùng yêu cầu giảm chuyển động. Không thêm thư viện hay yêu cầu tải ảnh bên ngoài.

## Hiệu ứng phong cách iOS

`ios-effects.css` và `ios-effects.js` bổ sung kính mờ ở các bảng nổi, phản sáng theo chuột trên thẻ, gợn sáng khi bấm, phản hồi nhấn và hiệu ứng mở bảng/công tắc. Đây là hiệu ứng web viết bằng CSS/JavaScript, lấy cảm hứng từ iOS; không thực thi Swift/Objective-C trong trình duyệt.

Phản sáng chỉ dùng với chuột; gợn sáng chỉ xuất hiện sau một lần bấm, không xuất hiện khi vuốt cuộn. Hiệu ứng tôn trọng tuỳ chọn giảm chuyển động của thiết bị và công tắc Chuyển động trong bảng giao diện. Nếu trình duyệt không hỗ trợ kính mờ, nền tối có sẵn vẫn giữ nội dung đọc được. Đã kiểm tra xử lý tương tác bằng DOM giả lập; chất lượng hình ảnh và độ mượt trên thiết bị thật chưa được xác nhận.
