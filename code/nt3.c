#include <stdio.h>
#include <math.h>
   int main(){
  	int x, n;
	   double kq;
	 do {
	 	printf("Nhap X :");
		 scanf("%d",&x);
	 	printf("Nhap N :");
		 scanf("%d",&n);
		 
		 if (x <= 0 || n <= 0){
		 	printf("Nhap sai,Nhap lai\n");
		 }
}while(x <= 0 || n <= 0);

kq = pow(x * x +1, n);
printf("ket qua = %.0f",kq);
return 0;
} 


		 
